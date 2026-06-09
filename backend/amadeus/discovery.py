"""Ticket discovery via TJQ (recent) and RTD (archived) commands."""
import logging
from datetime import date, timedelta
from typing import Optional
from .commands import build_command
from .parser import parse_tjq_response, parse_rtd_response

logger = logging.getLogger(__name__)

MAX_TJQ_DAYS = 62


async def discover_tickets_recent(session, query_date: date) -> list[str]:
    """Use TJQ to discover tickets sold on a given date (max 62 days back)."""
    date_str = query_date.strftime("%d%b%y").upper()
    command = build_command("sales_query_date", date=date_str)
    logger.debug("Executing: %s", command)
    screen = await session.execute_command(command)
    return parse_tjq_response(screen)


async def discover_tickets_archived(session, query_date: date) -> list[str]:
    """Use RTD to discover tickets for dates 12+ months back."""
    date_str = query_date.strftime("%d%b%y").upper()
    command = build_command("archived_retrieval", date=date_str)
    logger.debug("Executing: %s", command)
    screen = await session.execute_command(command)
    return parse_rtd_response(screen)


async def discover_tickets_range(
    session,
    start_date: date,
    end_date: Optional[date] = None,
) -> list[str]:
    """Discover all ticket numbers across a date range, choosing TJQ vs RTD automatically."""
    if end_date is None:
        end_date = date.today()

    all_tickets: list[str] = []
    current = start_date

    while current <= end_date:
        days_ago = (date.today() - current).days
        try:
            if days_ago <= MAX_TJQ_DAYS:
                tickets = await discover_tickets_recent(session, current)
            else:
                tickets = await discover_tickets_archived(session, current)
            all_tickets.extend(tickets)
        except Exception as exc:
            logger.warning("Discovery failed for %s: %s", current, exc)

        current += timedelta(days=1)

    return list(set(all_tickets))
