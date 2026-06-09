from typing import Annotated
from datetime import datetime, timezone
from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    email: Annotated[str, Indexed(unique=True)]
    password_hash: str
    role: str = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
