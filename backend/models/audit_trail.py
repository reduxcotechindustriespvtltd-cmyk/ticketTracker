from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from .base import Base


class AuditTrail(Base):
    __tablename__ = "audit_trail"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    command_used = Column(String(255), nullable=False)
    raw_response = Column(Text, nullable=True)
    parsed_at = Column(DateTime(timezone=True), server_default=func.now())
