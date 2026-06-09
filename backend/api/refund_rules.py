from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models import RefundRule, User
from ..models.refund_rule import PenaltyType
from ..auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/refund-rules", tags=["refund-rules"])


class RefundRuleUpdate(BaseModel):
    fare_type: Optional[str] = None
    refund_window_days: Optional[int] = None
    noshow_window_days: Optional[int] = None
    penalty_type: PenaltyType
    penalty_value: float


@router.get("")
def list_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rules = db.query(RefundRule).all()
    return [
        {
            "id": r.id,
            "carrier_code": r.carrier_code,
            "fare_type": r.fare_type,
            "refund_window_days": r.refund_window_days,
            "noshow_window_days": r.noshow_window_days,
            "penalty_type": r.penalty_type.value,
            "penalty_value": float(r.penalty_value),
        }
        for r in rules
    ]


@router.put("/{carrier}")
def update_rule(
    carrier: str,
    body: RefundRuleUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    carrier = carrier.upper()
    rule = db.query(RefundRule).filter(RefundRule.carrier_code == carrier).first()
    if not rule:
        rule = RefundRule(carrier_code=carrier)
        db.add(rule)

    rule.fare_type = body.fare_type
    rule.refund_window_days = body.refund_window_days
    rule.noshow_window_days = body.noshow_window_days
    rule.penalty_type = body.penalty_type
    rule.penalty_value = body.penalty_value
    db.commit()
    return {"message": f"Refund rule for {carrier} saved"}
