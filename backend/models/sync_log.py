from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from .base import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    synced_at = Column(DateTime(timezone=True), server_default=func.now())
    tickets_fetched = Column(Integer, default=0)
    tickets_flagged = Column(Integer, default=0)
    errors = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
