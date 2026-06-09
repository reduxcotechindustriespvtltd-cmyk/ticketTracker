"""Celery tasks for Amadeus synchronisation."""
import asyncio
import logging
import time
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from .celery_app import celery_app
from ..models.ticket import TicketTag
from ..amadeus.commands import build_command
from ..amadeus.parser import parse_twd_response, parse_pnr_history, map_status_text_to_code
from ..amadeus.discovery import discover_tickets_range
from ..logic.categorise import categorise_ticket
from ..logic.refund import calculate_net_refund
from ..utils.encryption import decrypt

logger = logging.getLogger(__name__)

_DEFAULT_REFUND_WINDOW_DAYS = 365


async def _ensure_beanie():
    from ..database import init_db
    await init_db()


@celery_app.task(bind=True, max_retries=3)
def sync_amadeus_tickets(self, tenant_id: str, start_date_iso: str, end_date_iso: Optional[str] = None):
    start_time = time.time()
    tickets_fetched = 0
    tickets_flagged = 0
    errors = []

    async def run():
        nonlocal tickets_fetched, tickets_flagged
        await _ensure_beanie()

        from ..models import AmadeusConfig, Ticket, SyncLog
        from beanie import PydanticObjectId

        tid = PydanticObjectId(tenant_id)
        config = await AmadeusConfig.find_one(AmadeusConfig.user_id == tid)
        if not config:
            raise ValueError(f"No Amadeus config found for tenant {tenant_id}")

        username = decrypt(config.wsap_user_encrypted)
        password = decrypt(config.wsap_pass_encrypted)
        totp_secret = decrypt(config.totp_secret_encrypted) if config.totp_secret_encrypted else None

        start_date = date.fromisoformat(start_date_iso)
        end_date = date.fromisoformat(end_date_iso) if end_date_iso else date.today()

        from ..amadeus.session import AmadeusSession
        async with AmadeusSession(
            config.office_id, username, password, totp_secret,
            wsap_endpoint=config.wsap_endpoint,
        ) as session:
            ticket_numbers = await discover_tickets_range(session, start_date, end_date)
            logger.info("Discovered %d tickets for tenant %s", len(ticket_numbers), tenant_id)

            for ticket_number in ticket_numbers:
                try:
                    await _process_ticket(session, tenant_id, ticket_number)
                    tickets_fetched += 1

                    t = await Ticket.find_one(
                        Ticket.ticket_number == ticket_number,
                        Ticket.tenant_id == tid,
                    )
                    if t and t.tag in (TicketTag.no_show, TicketTag.cancelled_before_dep):
                        tickets_flagged += 1
                except Exception as exc:
                    logger.warning("Failed to process ticket %s: %s", ticket_number, exc)
                    errors.append(f"{ticket_number}: {exc}")

        duration_ms = int((time.time() - start_time) * 1000)
        await SyncLog(
            tenant_id=tid,
            tickets_fetched=tickets_fetched,
            tickets_flagged=tickets_flagged,
            errors="\n".join(errors) if errors else None,
            duration_ms=duration_ms,
        ).insert()

        config.last_synced_at = datetime.now(timezone.utc)
        await config.save()

    try:
        asyncio.run(run())
        return {"status": "ok", "fetched": tickets_fetched, "flagged": tickets_flagged}
    except Exception as exc:
        logger.error("Sync failed for tenant %s: %s", tenant_id, exc)
        raise self.retry(exc=exc, countdown=60)


async def _process_ticket(session, tenant_id: str, ticket_number: str) -> None:
    from ..models import Ticket, AuditTrail, RefundRule
    from beanie import PydanticObjectId

    tid = PydanticObjectId(tenant_id)
    audit_entries: list[tuple[str, str]] = []

    twd_cmd = build_command("ticket_display", ticket_number=ticket_number)
    twd_screen = await session.execute_command(twd_cmd)
    audit_entries.append((twd_cmd, twd_screen))

    if "NOT FOUND" in twd_screen or "ETR NOT FOUND" in twd_screen:
        await _upsert_ticket(tenant_id, ticket_number, {"tag": TicketTag.manual_check.value})
        await _flush_audit(tenant_id, ticket_number, audit_entries)
        return

    parsed = parse_twd_response(twd_screen)
    coupon_status_raw = _worst_coupon_status(parsed)
    pnr_locator = parsed.get("pnr_locator")

    pnr_cancelled_at = None
    if coupon_status_raw in ("O", "NS") and pnr_locator:
        try:
            rt_cmd = build_command("pnr_retrieve", pnr_locator=pnr_locator)
            rt_screen = await session.execute_command(rt_cmd)
            audit_entries.append((rt_cmd, rt_screen))

            rh_cmd = build_command("pnr_history")
            rh_screen = await session.execute_command(rh_cmd)
            audit_entries.append((rh_cmd, rh_screen))

            hist = parse_pnr_history(rh_screen)
            if hist.get("cancelled_date_raw"):
                pnr_cancelled_at = datetime.strptime(
                    hist["cancelled_date_raw"] + hist.get("cancelled_time_raw", "0000"),
                    "%d%b%y%H%M",
                ).replace(tzinfo=timezone.utc)
        except Exception as exc:
            logger.debug("RH failed for %s: %s", pnr_locator, exc)

    departure_date = _parse_date(parsed.get("coupons", [{}])[0].get("date") if parsed.get("coupons") else None)
    tag = categorise_ticket(coupon_status_raw or "O", departure_date, pnr_cancelled_at)

    carrier = parsed.get("coupons", [{}])[0].get("carrier") if parsed.get("coupons") else None
    refund_rule = None
    if carrier and tag in ("no_show", "cancelled_before_dep"):
        refund_rule = await RefundRule.find_one(RefundRule.carrier_code == carrier)

    penalty, net_refund = calculate_net_refund(
        parsed.get("total_fare"), parsed.get("base_fare"), tag, refund_rule
    )

    refund_deadline = _compute_refund_deadline(departure_date, tag, refund_rule)

    await _upsert_ticket(tenant_id, ticket_number, {
        "pnr_locator": pnr_locator,
        "passenger_name": parsed.get("passenger_name"),
        "route": parsed.get("route"),
        "origin": parsed.get("origin"),
        "destination": parsed.get("destination"),
        "carrier_code": carrier,
        "departure_date": departure_date,
        "coupon_status": coupon_status_raw,
        "tag": tag,
        "fare_basis_code": parsed.get("fare_basis_code"),
        "base_fare": parsed.get("base_fare"),
        "tax_amount": parsed.get("tax_amount"),
        "total_fare": parsed.get("total_fare"),
        "currency": parsed.get("currency"),
        "cancellation_penalty": float(penalty),
        "net_refund_amount": float(net_refund),
        "pnr_cancelled_at": pnr_cancelled_at,
        "categorised_at": datetime.now(timezone.utc),
        "last_synced_at": datetime.now(timezone.utc),
        "refund_deadline": refund_deadline,
    })

    await _flush_audit(tenant_id, ticket_number, audit_entries)


async def _upsert_ticket(tenant_id: str, ticket_number: str, data: dict) -> None:
    from ..models import Ticket
    from beanie import PydanticObjectId
    from bson import ObjectId

    tid = ObjectId(tenant_id)
    collection = Ticket.get_motor_collection()
    now = datetime.now(timezone.utc)
    await collection.update_one(
        {"tenant_id": tid, "ticket_number": ticket_number},
        {
            "$set": data,
            "$setOnInsert": {"tenant_id": tid, "ticket_number": ticket_number, "created_at": now},
        },
        upsert=True,
    )


async def _flush_audit(tenant_id: str, ticket_number: str, entries: list[tuple[str, str]]) -> None:
    from ..models import Ticket, AuditTrail
    from beanie import PydanticObjectId

    tid = PydanticObjectId(tenant_id)
    ticket = await Ticket.find_one(Ticket.ticket_number == ticket_number, Ticket.tenant_id == tid)
    if not ticket:
        return
    for command, response in entries:
        await AuditTrail(ticket_id=ticket.id, command_used=command, raw_response=response).insert()


def _compute_refund_deadline(departure_date, tag, refund_rule) -> Optional[date]:
    if not departure_date or tag not in ("no_show", "cancelled_before_dep"):
        return None
    window = (refund_rule.refund_window_days if refund_rule and refund_rule.refund_window_days
              else _DEFAULT_REFUND_WINDOW_DAYS)
    return departure_date + timedelta(days=window)


def _worst_coupon_status(parsed: dict) -> str:
    priority = {"NS": 0, "O": 1, "A": 2, "E": 3, "F": 4, "R": 5, "V": 6}
    statuses = [
        map_status_text_to_code(c.get("status_text", "")) or c.get("status_code", "O")
        for c in parsed.get("coupons", [])
    ]
    if not statuses:
        return parsed.get("coupon_status", "O")
    return min(statuses, key=lambda s: priority.get(s, 99))


def _parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%d%b%y").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%d%b%Y").date()
        except ValueError:
            return None
