from sqlalchemy import Column, Integer, String, Numeric, Enum
from .base import Base
import enum


class PenaltyType(str, enum.Enum):
    flat = "flat"
    percentage = "percentage"


class RefundRule(Base):
    __tablename__ = "refund_rules"

    id = Column(Integer, primary_key=True, index=True)
    carrier_code = Column(String(2), nullable=False, index=True)
    fare_type = Column(String(50), nullable=True)
    refund_window_days = Column(Integer, nullable=True)
    noshow_window_days = Column(Integer, nullable=True)
    penalty_type = Column(Enum(PenaltyType), nullable=False)
    penalty_value = Column(Numeric(12, 2), nullable=False)
