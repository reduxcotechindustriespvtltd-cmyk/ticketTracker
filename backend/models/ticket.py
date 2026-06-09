from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date, ForeignKey, Enum, Boolean, func
from .base import Base
import enum


class CouponStatus(str, enum.Enum):
    O = "O"   # Open
    NS = "NS" # No-Show
    F = "F"   # Flown
    V = "V"   # Void
    R = "R"   # Refunded
    E = "E"   # Exchanged
    A = "A"   # Airport Control


class TicketTag(str, enum.Enum):
    no_show = "no_show"
    cancelled_before_dep = "cancelled_before_dep"
    used = "used"
    refunded = "refunded"
    active = "active"
    retry_48hrs = "retry_48hrs"
    manual_check = "manual_check"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ticket_number = Column(String(13), nullable=False, index=True)
    pnr_locator = Column(String(20), nullable=True)
    passenger_name = Column(String(255), nullable=True)
    route = Column(String(255), nullable=True)
    origin = Column(String(3), nullable=True)
    destination = Column(String(3), nullable=True)
    carrier_code = Column(String(2), nullable=True)
    departure_date = Column(Date, nullable=True)
    issue_date = Column(Date, nullable=True)
    coupon_status = Column(Enum(CouponStatus), nullable=True)
    tag = Column(Enum(TicketTag), nullable=True)
    fare_basis_code = Column(String(50), nullable=True)
    base_fare = Column(Numeric(12, 2), nullable=True)
    tax_amount = Column(Numeric(12, 2), nullable=True)
    total_fare = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(3), nullable=True)
    cancellation_penalty = Column(Numeric(12, 2), nullable=True)
    net_refund_amount = Column(Numeric(12, 2), nullable=True)
    pnr_cancelled_at = Column(DateTime(timezone=True), nullable=True)
    categorised_at = Column(DateTime(timezone=True), nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    refund_deadline = Column(Date, nullable=True)
    is_urgent = Column(Boolean, nullable=False, default=False, server_default="false")
