from typing import Annotated, Optional
from beanie import Document, Indexed
import enum


class PenaltyType(str, enum.Enum):
    flat = "flat"
    percentage = "percentage"


class RefundRule(Document):
    carrier_code: Annotated[str, Indexed(unique=True)]
    fare_type: Optional[str] = None
    refund_window_days: Optional[int] = None
    noshow_window_days: Optional[int] = None
    penalty_type: PenaltyType
    penalty_value: float

    class Settings:
        name = "refund_rules"
