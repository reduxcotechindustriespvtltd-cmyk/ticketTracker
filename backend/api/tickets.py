from fastapi import APIRouter, Depends, HTTPException, Query
from beanie import PydanticObjectId
from typing import Optional
from datetime import date

from ..models import Ticket, User
from ..models.ticket import TicketTag
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/tickets", tags=["tickets"])


def ticket_to_dict(t: Ticket) -> dict:
    return {
        "id": str(t.id),
        "ticket_number": t.ticket_number,
        "pnr_locator": t.pnr_locator,
        "passenger_name": t.passenger_name,
        "route": t.route,
        "origin": t.origin,
        "destination": t.destination,
        "carrier_code": t.carrier_code,
        "departure_date": t.departure_date.isoformat() if t.departure_date else None,
        "issue_date": t.issue_date.isoformat() if t.issue_date else None,
        "coupon_status": t.coupon_status.value if t.coupon_status else None,
        "tag": t.tag.value if t.tag else None,
        "fare_basis_code": t.fare_basis_code,
        "base_fare": t.base_fare,
        "tax_amount": t.tax_amount,
        "total_fare": t.total_fare,
        "currency": t.currency,
        "cancellation_penalty": t.cancellation_penalty,
        "net_refund_amount": t.net_refund_amount,
        "pnr_cancelled_at": t.pnr_cancelled_at.isoformat() if t.pnr_cancelled_at else None,
        "categorised_at": t.categorised_at.isoformat() if t.categorised_at else None,
        "last_synced_at": t.last_synced_at.isoformat() if t.last_synced_at else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "refund_deadline": t.refund_deadline.isoformat() if t.refund_deadline else None,
        "is_urgent": t.is_urgent,
        "days_until_expiry": _days_until_expiry(t),
        "sync_status": "synced" if t.last_synced_at else "processing",
    }


def _days_until_expiry(t: Ticket) -> Optional[int]:
    deadline = t.refund_deadline or t.departure_date
    if not deadline:
        return None
    return (deadline - date.today()).days


@router.get("")
async def list_tickets(
    tag: Optional[str] = Query(None),
    carrier: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    departure_from: Optional[date] = Query(None),
    departure_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    filters = [Ticket.tenant_id == current_user.id]

    if tag:
        filters.append(Ticket.tag == tag)
    if carrier:
        filters.append(Ticket.carrier_code == carrier)
    if departure_from:
        filters.append(Ticket.departure_date >= departure_from)
    if departure_to:
        filters.append(Ticket.departure_date <= departure_to)

    query = Ticket.find(*filters)

    if search:
        from beanie.operators import Or, RegEx
        pattern = f".*{search}.*"
        query = Ticket.find(
            *filters,
            Or(
                RegEx(Ticket.passenger_name, pattern, "i"),
                RegEx(Ticket.ticket_number, pattern, "i"),
                RegEx(Ticket.pnr_locator, pattern, "i"),
            ),
        )

    total = await query.count()
    tickets = await query.sort(-Ticket.departure_date).skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [ticket_to_dict(t) for t in tickets],
    }


@router.get("/summary")
async def get_summary(current_user: User = Depends(get_current_user)):
    uid = current_user.id
    total = await Ticket.find(Ticket.tenant_id == uid).count()
    no_show = await Ticket.find(Ticket.tenant_id == uid, Ticket.tag == TicketTag.no_show).count()
    cancelled = await Ticket.find(Ticket.tenant_id == uid, Ticket.tag == TicketTag.cancelled_before_dep).count()

    recoverable_tags = [TicketTag.no_show.value, TicketTag.cancelled_before_dep.value]
    pipeline = [
        {"$match": {"tenant_id": uid, "tag": {"$in": recoverable_tags}, "net_refund_amount": {"$gt": 0}}},
        {"$group": {"_id": None, "total": {"$sum": "$net_refund_amount"}, "count": {"$sum": 1}}},
    ]
    result = await Ticket.get_motor_collection().aggregate(pipeline).to_list(1)
    total_recoverable = result[0]["total"] if result else 0
    recoverable_count = result[0]["count"] if result else 0

    return {
        "total_tickets": total,
        "no_show": no_show,
        "cancelled_before_dep": cancelled,
        "total_recoverable_value": float(total_recoverable),
        "recoverable_tickets": recoverable_count,
    }


@router.get("/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
):
    ticket = await Ticket.find_one(
        Ticket.id == PydanticObjectId(ticket_id),
        Ticket.tenant_id == current_user.id,
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket_to_dict(ticket)
