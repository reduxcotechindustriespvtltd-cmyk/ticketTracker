from typing import Annotated, Optional
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId


class AmadeusConfig(Document):
    user_id: Annotated[PydanticObjectId, Indexed(unique=True)]
    office_id: str
    wsap_endpoint: Optional[str] = None
    wsap_user_encrypted: str
    wsap_pass_encrypted: str
    totp_secret_encrypted: Optional[str] = None
    last_synced_at: Optional[datetime] = None

    class Settings:
        name = "amadeus_config"
