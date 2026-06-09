"""Generate realistic demo ticket data for CSV uploads when GDS is unavailable."""
import hashlib
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from ..models.ticket import TicketTag, CouponStatus

CARRIER_MAP = {
    "057": "AI",
    "176": "6E",
    "098": "AI",
    "125": "UK",
    "074": "SG",
    "220": "LH",
}

ROUTES = [
    ("BOM", "DEL"),
    ("DEL", "DXB"),
    ("BLR", "BOM"),
    ("BOM", "BLR"),
    ("DEL", "BOM"),
    ("MAA", "DEL"),
    ("HYD", "BOM"),
    ("CCU", "DEL"),
]

PASSENGERS = [
    "SHARMA/RAHUL",
    "PATEL/PRIYA",
    "KUMAR/AMIT",
    "SINGH/NEHA",
    "REDDY/VIKRAM",
    "GUPTA/ANITA",
    "MEHTA/SANJAY",
    "RAO/LAKSHMI",
    "JOSHI/KAVITA",
    "NAIR/ARUN",
]

TAGS = [
    TicketTag.no_show,
    TicketTag.cancelled_before_dep,
    TicketTag.no_show,
    TicketTag.cancelled_before_dep,
    TicketTag.active,
    TicketTag.no_show,
    TicketTag.cancelled_before_dep,
    TicketTag.retry_48hrs,
    TicketTag.no_show,
    TicketTag.cancelled_before_dep,
]

PENALTIES = [2500, 3000, 3500, 4000, 1500, 5000]


def _seed(ticket_number: str) -> int:
    return int(hashlib.md5(ticket_number.encode()).hexdigest()[:8], 16)


def _parse_csv_date(value: str):
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


def generate_demo_ticket(ticket_number: str, extra: Optional[dict] = None) -> dict:
    """Build a fully populated ticket dict from a ticket number."""
    extra = extra or {}
    seed = _seed(ticket_number)
    idx = seed % len(PASSENGERS)

    prefix = ticket_number[:3]
    carrier = CARRIER_MAP.get(prefix, "AI")
    origin, dest = ROUTES[seed % len(ROUTES)]
    tag = TAGS[seed % len(TAGS)]

    departure = _parse_csv_date(extra.get("departure_date")) or (date.today() - timedelta(days=14 + (seed % 60)))
    issue = _parse_csv_date(extra.get("issue_date")) or (departure - timedelta(days=30 + (seed % 30)))

    base_fare = Decimal(8000 + (seed % 12) * 1500)
    tax = Decimal(1200 + (seed % 5) * 200)
    total = base_fare + tax
    penalty = Decimal(PENALTIES[seed % len(PENALTIES)])
    net_refund = max(total - penalty, Decimal(0)) if tag in (
        TicketTag.no_show, TicketTag.cancelled_before_dep
    ) else Decimal(0)

    now = datetime.now(timezone.utc)
    return {
        "pnr_locator": (extra.get("pnr_locator") or f"PNR{seed % 10000:04d}")[:6].upper(),
        "passenger_name": extra.get("passenger_name") or PASSENGERS[idx],
        "route": f"{origin}-{dest}",
        "origin": origin,
        "destination": dest,
        "carrier_code": carrier,
        "departure_date": departure,
        "issue_date": issue,
        "coupon_status": CouponStatus.NS if tag == TicketTag.no_show else CouponStatus.O,
        "tag": tag,
        "fare_basis_code": f"{carrier}OW{seed % 9 + 1}",
        "base_fare": base_fare,
        "tax_amount": tax,
        "total_fare": total,
        "currency": "INR",
        "cancellation_penalty": penalty if tag in (TicketTag.no_show, TicketTag.cancelled_before_dep) else Decimal(0),
        "net_refund_amount": net_refund,
        "categorised_at": now,
        "last_synced_at": now,
    }


def build_stub_ticket(extra: Optional[dict] = None) -> dict:
    """Minimal ticket row visible in the table while GDS lookup is pending."""
    extra = extra or {}
    return {
        "pnr_locator": extra.get("pnr_locator") or None,
        "passenger_name": extra.get("passenger_name") or None,
        "departure_date": _parse_csv_date(extra.get("departure_date")),
        "issue_date": _parse_csv_date(extra.get("issue_date")),
        "tag": TicketTag.manual_check,
        "last_synced_at": None,
    }
