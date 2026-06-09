"""Periodic Celery tasks for ticket maintenance."""
import logging
from datetime import date, timedelta, datetime, timezone

from .celery_app import celery_app
from ..database import SessionLocal
from ..models import Ticket
from ..models.ticket import TicketTag

logger = logging.getLogger(__name__)

URGENT_WINDOW_DAYS = 7


@celery_app.task
def retry_airport_control_tickets():
    """Re-categorise airport-control (status A) tickets older than 48 hours."""
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
        tickets = db.query(Ticket).filter(
            Ticket.tag == TicketTag.retry_48hrs,
            Ticket.last_synced_at <= cutoff,
        ).all()

        for ticket in tickets:
            from ..logic.categorise import categorise_ticket
            new_tag = categorise_ticket(
                ticket.coupon_status.value if ticket.coupon_status else "A",
                ticket.departure_date,
                ticket.pnr_cancelled_at,
            )
            ticket.tag = new_tag
            ticket.categorised_at = datetime.now(timezone.utc)

        db.commit()
        logger.info("Retried %d airport-control tickets", len(tickets))
        return {"retried": len(tickets)}
    finally:
        db.close()


@celery_app.task
def check_expiring_tickets():
    """Set is_urgent=True on recoverable tickets whose refund_deadline is within 7 days."""
    db = SessionLocal()
    try:
        today = date.today()
        deadline_cutoff = today + timedelta(days=URGENT_WINDOW_DAYS)

        # Mark urgent: recoverable tickets with a refund_deadline within the window
        newly_urgent = db.query(Ticket).filter(
            Ticket.tag.in_([TicketTag.no_show, TicketTag.cancelled_before_dep]),
            Ticket.net_refund_amount > 0,
            Ticket.refund_deadline.isnot(None),
            Ticket.refund_deadline >= today,
            Ticket.refund_deadline <= deadline_cutoff,
            Ticket.is_urgent == False,  # noqa: E712
        ).all()

        for ticket in newly_urgent:
            ticket.is_urgent = True
            logger.warning(
                "Ticket %s (tenant %s) expires in %d days — refund deadline %s",
                ticket.ticket_number,
                ticket.tenant_id,
                (ticket.refund_deadline - today).days,
                ticket.refund_deadline,
            )

        # Clear urgent flag for tickets past deadline or no longer recoverable
        cleared = db.query(Ticket).filter(
            Ticket.is_urgent == True,  # noqa: E712
            Ticket.refund_deadline < today,
        ).all()
        for ticket in cleared:
            ticket.is_urgent = False

        db.commit()
        logger.info(
            "check_expiring_tickets: %d newly urgent, %d cleared",
            len(newly_urgent),
            len(cleared),
        )
        return {
            "newly_urgent": len(newly_urgent),
            "cleared": len(cleared),
            "urgent_ticket_numbers": [t.ticket_number for t in newly_urgent],
        }
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def process_csv_ticket(self, tenant_id: int, ticket_number: str, extra_data: dict):
    """Process a single ticket number from a CSV upload."""
    from ..database import SessionLocal
    from ..models import AmadeusConfig
    from ..utils.encryption import decrypt
    from ..amadeus.session import AmadeusSession
    from .sync import _process_ticket
    import asyncio

    db = SessionLocal()
    try:
        config = db.query(AmadeusConfig).filter(AmadeusConfig.user_id == tenant_id).first()
        if not config:
            raise ValueError("No Amadeus config")

        username = decrypt(config.wsap_user_encrypted)
        password = decrypt(config.wsap_pass_encrypted)
        totp_secret = decrypt(config.totp_secret_encrypted) if config.totp_secret_encrypted else None

        async def run():
            async with AmadeusSession(
                config.office_id, username, password, totp_secret,
                wsap_endpoint=config.wsap_endpoint,
            ) as session:
                await _process_ticket(session, db, tenant_id, ticket_number)

        asyncio.run(run())
        db.commit()
        return {"status": "ok", "ticket_number": ticket_number}

    except Exception as exc:
        db.rollback()
        logger.error("CSV ticket processing failed for %s: %s", ticket_number, exc)
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()
