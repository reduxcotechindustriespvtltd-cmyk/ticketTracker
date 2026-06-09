from typing import Optional
from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field


class SyncLog(Document):
    tenant_id: PydanticObjectId
    synced_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tickets_fetched: int = 0
    tickets_flagged: int = 0
    errors: Optional[str] = None
    duration_ms: Optional[int] = None

    class Settings:
        name = "sync_logs"
