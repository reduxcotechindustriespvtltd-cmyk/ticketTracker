from datetime import date
from typing import Optional


def categorise_ticket(
    coupon_status: str,
    departure_date: Optional[date],
    pnr_cancelled_at,
    current_date: Optional[date] = None,
) -> str:
    """
    Returns: 'used', 'refunded', 'active', 'no_show', 'cancelled_before_dep', 'retry_48hrs'
    """
    if current_date is None:
        current_date = date.today()

    if coupon_status in ("F", "P"):
        return "used"

    if coupon_status in ("R", "V"):
        return "refunded"

    if departure_date and departure_date > current_date:
        return "active"

    # Flight has departed (or no departure date)
    if coupon_status == "NS":
        return "no_show"

    if coupon_status == "O":
        cancelled_before = (
            pnr_cancelled_at is not None
            and departure_date is not None
            and _as_date(pnr_cancelled_at) < departure_date
        )
        if cancelled_before:
            return "cancelled_before_dep"
        return "no_show"

    if coupon_status == "A":
        return "retry_48hrs"

    return "manual_check"


def _as_date(value) -> date:
    """Coerce datetime or date to date."""
    if hasattr(value, "date"):
        return value.date()
    return value
