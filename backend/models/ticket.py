from typing import Annotated, Optional
from datetime import datetime, date, timezone
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ASCENDING
import enum


class CouponStatus(str, enum.Enum):
    O = "O"
    NS = "NS"
    F = "F"
    V = "V"
    R = "R"
    E = "E"
    A = "A"


class TicketTag(str, enum.Enum):
    no_show = "no_show"
    cancelled_before_dep = "cancelled_before_dep"
    used = "used"
    refunded = "refunded"
    active = "active"
    retry_48hrs = "retry_48hrs"
    manual_check = "manual_check"


class Ticket(Document):
    tenant_id: PydanticObjectId
    ticket_number: Annotated[str, Indexed()]
    pnr_locator: Optional[str] = None
    passenger_name: Optional[str] = None
    route: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    carrier_code: Optional[str] = None
    departure_date: Optional[date] = None
    issue_date: Optional[date] = None
    coupon_status: Optional[CouponStatus] = None
    tag: Optional[TicketTag] = None
    fare_basis_code: Optional[str] = None
    base_fare: Optional[float] = None
    tax_amount: Optional[float] = None
    total_fare: Optional[float] = None
    currency: Optional[str] = None
    cancellation_penalty: Optional[float] = None
    net_refund_amount: Optional[float] = None
    pnr_cancelled_at: Optional[datetime] = None
    categorised_at: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    refund_deadline: Optional[date] = None
    is_urgent: bool = False

    class Settings:
        name = "tickets"
        indexes = [
            IndexModel(
                [("tenant_id", ASCENDING), ("ticket_number", ASCENDING)],
                unique=True,
                name="uq_tenant_ticket",
            ),
        ]
