from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, model_validator
from datetime import date
from typing import Optional

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
async def trigger_manual_sync(
    body: SyncRequest,
    current_user: User = Depends(get_current_user),
):
    config = await AmadeusConfig.find_one(AmadeusConfig.user_id == current_user.id)
    if not config:
        raise HTTPException(status_code=400, detail="Amadeus config not set up")

    task = sync_amadeus_tickets.delay(
        str(current_user.id),
        body.start_date.isoformat(),
        body.end_date.isoformat() if body.end_date else None,
    )
    return {"task_id": task.id, "status": "queued", "message": "Sync started"}


@router.get("/status")
async def get_sync_status(current_user: User = Depends(get_current_user)):
    last_log = await SyncLog.find(
        SyncLog.tenant_id == current_user.id
    ).sort(-SyncLog.synced_at).first_or_none()

    if not last_log:
        return {"last_sync": None}

    return {
        "last_sync": last_log.synced_at.isoformat(),
        "tickets_fetched": last_log.tickets_fetched,
        "tickets_flagged": last_log.tickets_flagged,
        "duration_ms": last_log.duration_ms,
        "errors": last_log.errors,
    }
