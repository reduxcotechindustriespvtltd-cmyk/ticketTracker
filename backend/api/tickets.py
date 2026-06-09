from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date
from decimal import Decimal

from ..database import get_db
from ..models import Ticket, User
from ..models.ticket import TicketTag
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/tickets", tags=["tickets"])


def ticket_to_dict(t: Ticket) -> dict:
    return {
        "id": t.id,
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
        "base_fare": float(t.base_fare) if t.base_fare else None,
        "tax_amount": float(t.tax_amount) if t.tax_amount else None,
        "total_fare": float(t.total_fare) if t.total_fare else None,
        "currency": t.currency,
        "cancellation_penalty": float(t.cancellation_penalty) if t.cancellation_penalty else None,
        "net_refund_amount": float(t.net_refund_amount) if t.net_refund_amount else None,
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
    """Days until the refund deadline (stored on ticket) or falls back to departure date."""
    deadline = t.refund_deadline or t.departure_date
    if not deadline:
        return None
    return (deadline - date.today()).days


@router.get("")
def list_tickets(
    tag: Optional[str] = Query(None),
    carrier: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    departure_from: Optional[date] = Query(None),
    departure_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Ticket).filter(Ticket.tenant_id == current_user.id)

    if tag:
        q = q.filter(Ticket.tag == tag)
    if carrier:
        q = q.filter(Ticket.carrier_code == carrier)
    if departure_from:
        q = q.filter(Ticket.departure_date >= departure_from)
    if departure_to:
        q = q.filter(Ticket.departure_date <= departure_to)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            Ticket.passenger_name.ilike(pattern)
            | Ticket.ticket_number.ilike(pattern)
            | Ticket.pnr_locator.ilike(pattern)
        )

    total = q.count()
    tickets = q.order_by(Ticket.departure_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [ticket_to_dict(t) for t in tickets],
    }


@router.get("/summary")
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = db.query(Ticket).filter(Ticket.tenant_id == current_user.id)

    total = base.count()
    no_show = base.filter(Ticket.tag == TicketTag.no_show).count()
    cancelled = base.filter(Ticket.tag == TicketTag.cancelled_before_dep).count()

    recoverable = base.filter(
        Ticket.tag.in_([TicketTag.no_show, TicketTag.cancelled_before_dep]),
        Ticket.net_refund_amount > 0,
    )
    total_recoverable = db.query(func.sum(Ticket.net_refund_amount)).filter(
        Ticket.tenant_id == current_user.id,
        Ticket.tag.in_([TicketTag.no_show, TicketTag.cancelled_before_dep]),
        Ticket.net_refund_amount > 0,
    ).scalar() or 0

    return {
        "total_tickets": total,
        "no_show": no_show,
        "cancelled_before_dep": cancelled,
        "total_recoverable_value": float(total_recoverable),
        "recoverable_tickets": recoverable.count(),
    }


@router.get("/{ticket_id}")
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id, Ticket.tenant_id == current_user.id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket_to_dict(ticket)
