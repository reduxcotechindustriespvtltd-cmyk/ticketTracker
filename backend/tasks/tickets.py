"""Periodic Celery tasks for ticket maintenance."""
import asyncio
import logging
from datetime import date, timedelta, datetime, timezone

from .celery_app import celery_app
from ..models.ticket import TicketTag

logger = logging.getLogger(__name__)

URGENT_WINDOW_DAYS = 7


async def _ensure_beanie():
    from ..database import init_db
    await init_db()


@celery_app.task
def retry_airport_control_tickets():
    async def run():
        await _ensure_beanie()
        from ..models import Ticket

        cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
        tickets = await Ticket.find(
            Ticket.tag == TicketTag.retry_48hrs,
            Ticket.last_synced_at <= cutoff,
        ).to_list()

        from ..logic.categorise import categorise_ticket
        for ticket in tickets:
            new_tag = categorise_ticket(
                ticket.coupon_status.value if ticket.coupon_status else "A",
                ticket.departure_date,
                ticket.pnr_cancelled_at,
            )
            ticket.tag = new_tag
            ticket.categorised_at = datetime.now(timezone.utc)
            await ticket.save()

        logger.info("Retried %d airport-control tickets", len(tickets))
        return {"retried": len(tickets)}

    return asyncio.run(run())


@celery_app.task
def check_expiring_tickets():
    async def run():
        await _ensure_beanie()
        from ..models import Ticket

        today = date.today()
        deadline_cutoff = today + timedelta(days=URGENT_WINDOW_DAYS)

        newly_urgent = await Ticket.find(
            Ticket.tag.in_([TicketTag.no_show, TicketTag.cancelled_before_dep]),
            Ticket.net_refund_amount > 0,
            Ticket.refund_deadline != None,  # noqa: E711
            Ticket.refund_deadline >= today,
            Ticket.refund_deadline <= deadline_cutoff,
            Ticket.is_urgent == False,
        ).to_list()

        for ticket in newly_urgent:
            ticket.is_urgent = True
            await ticket.save()

        cleared = await Ticket.find(
            Ticket.is_urgent == True,
            Ticket.refund_deadline < today,
        ).to_list()
        for ticket in cleared:
            ticket.is_urgent = False
            await ticket.save()

        logger.info("check_expiring_tickets: %d newly urgent, %d cleared", len(newly_urgent), len(cleared))
        return {
            "newly_urgent": len(newly_urgent),
            "cleared": len(cleared),
            "urgent_ticket_numbers": [t.ticket_number for t in newly_urgent],
        }

    return asyncio.run(run())


@celery_app.task(bind=True, max_retries=3)
def process_csv_ticket(self, tenant_id: str, ticket_number: str, extra_data: dict):
    from .sync import _process_ticket, _ensure_beanie

    async def run():
        await _ensure_beanie()
        from ..models import AmadeusConfig
        from ..utils.encryption import decrypt
        from ..amadeus.session import AmadeusSession
        from beanie import PydanticObjectId

        tid = PydanticObjectId(tenant_id)
        config = await AmadeusConfig.find_one(AmadeusConfig.user_id == tid)
        if not config:
            raise ValueError("No Amadeus config")

        username = decrypt(config.wsap_user_encrypted)
        password = decrypt(config.wsap_pass_encrypted)
        totp_secret = decrypt(config.totp_secret_encrypted) if config.totp_secret_encrypted else None

        async with AmadeusSession(
            config.office_id, username, password, totp_secret,
            wsap_endpoint=config.wsap_endpoint,
        ) as session:
            await _process_ticket(session, tenant_id, ticket_number)

    try:
        asyncio.run(run())
        return {"status": "ok", "ticket_number": ticket_number}
    except Exception as exc:
        logger.error("CSV ticket processing failed for %s: %s", ticket_number, exc)
        raise self.retry(exc=exc, countdown=30)
