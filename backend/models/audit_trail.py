from typing import Optional
from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field


class AuditTrail(Document):
    ticket_id: PydanticObjectId
    command_used: str
    raw_response: Optional[str] = None
    parsed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_trail"
