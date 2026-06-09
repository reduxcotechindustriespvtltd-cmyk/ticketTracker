from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, model_validator
from datetime import date
from typing import Optional

from ..database import get_db
from ..models import SyncLog, AmadeusConfig, User
from ..auth.dependencies import get_current_user
from ..tasks.sync import sync_amadeus_tickets

router = APIRouter(prefix="/sync", tags=["sync"])

MAX_SYNC_DAYS = 90


class SyncRequest(BaseModel):
    start_date: date
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def check_range(self):
        end = self.end_date or date.today()
        if (end - self.start_date).days > MAX_SYNC_DAYS:
            raise ValueError(f"Sync range cannot exceed {MAX_SYNC_DAYS} days")
        if self.start_date > end:
            raise ValueError("start_date must be before end_date")
        return self


@router.post("/manual")
def trigger_manual_sync(
    body: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = db.query(AmadeusConfig).filter(AmadeusConfig.user_id == current_user.id).first()
    if not config:
        raise HTTPException(status_code=400, detail="Amadeus config not set up")

    task = sync_amadeus_tickets.delay(
        current_user.id,
        body.start_date.isoformat(),
        body.end_date.isoformat() if body.end_date else None,
    )
    return {"task_id": task.id, "status": "queued", "message": "Sync started"}


@router.get("/status")
def get_sync_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    last_log = (
        db.query(SyncLog)
        .filter(SyncLog.tenant_id == current_user.id)
        .order_by(SyncLog.synced_at.desc())
        .first()
    )
    if not last_log:
        return {"last_sync": None}

    return {
        "last_sync": last_log.synced_at.isoformat(),
        "tickets_fetched": last_log.tickets_fetched,
        "tickets_flagged": last_log.tickets_flagged,
        "duration_ms": last_log.duration_ms,
        "errors": last_log.errors,
    }
