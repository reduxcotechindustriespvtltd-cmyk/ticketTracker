"""Celery tasks for Amadeus synchronisation."""
import asyncio
import logging
import time
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.dialects.postgresql import insert as pg_insert

from .celery_app import celery_app
from ..database import SessionLocal
from ..models import AmadeusConfig, Ticket, SyncLog, AuditTrail, RefundRule
from ..models.ticket import TicketTag, CouponStatus
from ..amadeus.session import AmadeusSession
from ..amadeus.commands import build_command
from ..amadeus.parser import parse_twd_response, parse_pnr_history, map_status_text_to_code
from ..amadeus.discovery import discover_tickets_range
from ..logic.categorise import categorise_ticket
from ..logic.refund import calculate_net_refund
from ..utils.encryption import decrypt

logger = logging.getLogger(__name__)

_DEFAULT_REFUND_WINDOW_DAYS = 365  # IATA fallback when no carrier rule exists


@celery_app.task(bind=True, max_retries=3)
def sync_amadeus_tickets(self, tenant_id: int, start_date_iso: str, end_date_iso: Optional[str] = None):
    """Full Amadeus sync for a tenant across a date range."""
    start_time = time.time()
    db = SessionLocal()
    tickets_fetched = 0
    tickets_flagged = 0
    errors = []

    try:
        config = db.query(AmadeusConfig).filter(AmadeusConfig.user_id == tenant_id).first()
        if not config:
            raise ValueError(f"No Amadeus config found for tenant {tenant_id}")

        username = decrypt(config.wsap_user_encrypted)
        password = decrypt(config.wsap_pass_encrypted)
        totp_secret = decrypt(config.totp_secret_encrypted) if config.totp_secret_encrypted else None

        start_date = date.fromisoformat(start_date_iso)
        end_date = date.fromisoformat(end_date_iso) if end_date_iso else date.today()

        async def run_sync():
            nonlocal tickets_fetched, tickets_flagged

            async with AmadeusSession(
                config.office_id, username, password, totp_secret,
                wsap_endpoint=config.wsap_endpoint,
            ) as session:
                ticket_numbers = await discover_tickets_range(session, start_date, end_date)
                logger.info("Discovered %d tickets for tenant %d", len(ticket_numbers), tenant_id)

                for ticket_number in ticket_numbers:
                    try:
                        await _process_ticket(session, db, tenant_id, ticket_number)
                        tickets_fetched += 1

                        ticket = db.query(Ticket).filter(
                            Ticket.ticket_number == ticket_number,
                            Ticket.tenant_id == tenant_id,
                        ).first()
                        if ticket and ticket.tag in (TicketTag.no_show, TicketTag.cancelled_before_dep):
                            tickets_flagged += 1

                    except Exception as exc:
                        logger.warning("Failed to process ticket %s: %s", ticket_number, exc)
                        errors.append(f"{ticket_number}: {exc}")

        asyncio.run(run_sync())

        duration_ms = int((time.time() - start_time) * 1000)
        _write_sync_log(db, tenant_id, tickets_fetched, tickets_flagged, errors, duration_ms)

        db.query(AmadeusConfig).filter(AmadeusConfig.user_id == tenant_id).update(
            {"last_synced_at": datetime.now(timezone.utc)}
        )
        db.commit()
        return {"status": "ok", "fetched": tickets_fetched, "flagged": tickets_flagged}

    except Exception as exc:
        duration_ms = int((time.time() - start_time) * 1000)
        errors.append(str(exc))
        _write_sync_log(db, tenant_id, tickets_fetched, tickets_flagged, errors, duration_ms)
        db.commit()
        logger.error("Sync failed for tenant %d: %s", tenant_id, exc)
        raise self.retry(exc=exc, countdown=60)

    finally:
        db.close()


async def _process_ticket(session, db, tenant_id: int, ticket_number: str) -> None:
    """Fetch, parse, categorise and persist a single ticket."""
    audit_entries: list[tuple[str, str]] = []

    # TWD
    twd_cmd = build_command("ticket_display", ticket_number=ticket_number)
    twd_screen = await session.execute_command(twd_cmd)
    audit_entries.append((twd_cmd, twd_screen))

    if "NOT FOUND" in twd_screen or "ETR NOT FOUND" in twd_screen:
        _upsert_ticket(db, tenant_id, ticket_number, {"tag": TicketTag.manual_check})
        _flush_and_save_audit(db, tenant_id, ticket_number, audit_entries)
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
                from datetime import datetime as dt
                pnr_cancelled_at = dt.strptime(
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
        refund_rule = db.query(RefundRule).filter(RefundRule.carrier_code == carrier).first()

    penalty, net_refund = calculate_net_refund(
        parsed.get("total_fare"), parsed.get("base_fare"), tag, refund_rule
    )

    refund_deadline = _compute_refund_deadline(departure_date, tag, refund_rule)

    _upsert_ticket(db, tenant_id, ticket_number, {
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

    _flush_and_save_audit(db, tenant_id, ticket_number, audit_entries)
    db.commit()


def _compute_refund_deadline(
    departure_date: Optional[date],
    tag: str,
    refund_rule,
) -> Optional[date]:
    if not departure_date or tag not in ("no_show", "cancelled_before_dep"):
        return None
    window_days = (
        refund_rule.refund_window_days
        if refund_rule and refund_rule.refund_window_days
        else _DEFAULT_REFUND_WINDOW_DAYS
    )
    return departure_date + timedelta(days=window_days)


def _worst_coupon_status(parsed: dict) -> str:
    """Return worst-case coupon status across all coupons (priority: NS > O > A > F > R > V)."""
    priority = {"NS": 0, "O": 1, "A": 2, "E": 3, "F": 4, "R": 5, "V": 6}
    statuses = []
    for c in parsed.get("coupons", []):
        code = map_status_text_to_code(c.get("status_text", "")) or c.get("status_code", "O")
        statuses.append(code)
    if not statuses:
        return parsed.get("coupon_status", "O")
    return min(statuses, key=lambda s: priority.get(s, 99))


def _parse_date(date_str):
    if not date_str:
        return None
    from datetime import datetime
    try:
        return datetime.strptime(date_str, "%d%b%y").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%d%b%Y").date()
        except ValueError:
            return None


def _upsert_ticket(db, tenant_id: int, ticket_number: str, data: dict) -> None:
    values = {"tenant_id": tenant_id, "ticket_number": ticket_number, **data}
    stmt = (
        pg_insert(Ticket)
        .values(**values)
        .on_conflict_do_update(
            constraint="uq_tickets_tenant_ticket",
            set_={k: values[k] for k in data},
        )
    )
    db.execute(stmt)


def _flush_and_save_audit(db, tenant_id: int, ticket_number: str, entries: list[tuple[str, str]]) -> None:
    """Persist audit entries — called after the ticket row exists in the DB."""
    # Query within the open transaction; pg_insert already wrote the row.
    ticket = db.query(Ticket).filter(
        Ticket.ticket_number == ticket_number,
        Ticket.tenant_id == tenant_id,
    ).first()
    if not ticket:
        return
    for command, response in entries:
        db.add(AuditTrail(ticket_id=ticket.id, command_used=command, raw_response=response))


def _write_sync_log(db, tenant_id, fetched, flagged, errors, duration_ms):
    log = SyncLog(
        tenant_id=tenant_id,
        tickets_fetched=fetched,
        tickets_flagged=flagged,
        errors="\n".join(errors) if errors else None,
        duration_ms=duration_ms,
    )
    db.add(log)
