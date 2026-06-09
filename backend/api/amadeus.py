import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional

from ..database import get_db
from ..models import AmadeusConfig, User
from ..auth.dependencies import get_current_user
from ..utils.encryption import encrypt

router = APIRouter(prefix="/amadeus", tags=["amadeus"])

_OFFICE_ID_RE = re.compile(r"^[A-Z]{3}[A-Z0-9]{2}[A-Z0-9]{4}$")


class AmadeusConfigCreate(BaseModel):
    office_id: str
    wsap_endpoint: str
    wsap_user: str
    wsap_pass: str
    totp_secret: Optional[str] = None

    @field_validator("office_id")
    @classmethod
    def validate_office_id(cls, v: str) -> str:
        v = v.strip().upper()
        if not _OFFICE_ID_RE.match(v):
            raise ValueError("Office ID must be 9 characters: 3-letter city + 2 + 4 alphanumeric (e.g. BOMXX1234)")
        return v

    @field_validator("wsap_endpoint")
    @classmethod
    def validate_endpoint(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("https://"):
            raise ValueError("WSAP endpoint must start with https://")
        return v


@router.post("/config")
def save_config(
    body: AmadeusConfigCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(AmadeusConfig).filter(AmadeusConfig.user_id == current_user.id).first()

    encrypted_user = encrypt(body.wsap_user)
    encrypted_pass = encrypt(body.wsap_pass)
    encrypted_totp = encrypt(body.totp_secret) if body.totp_secret else None

    if existing:
        existing.office_id = body.office_id
        existing.wsap_endpoint = body.wsap_endpoint
        existing.wsap_user_encrypted = encrypted_user
        existing.wsap_pass_encrypted = encrypted_pass
        existing.totp_secret_encrypted = encrypted_totp
    else:
        config = AmadeusConfig(
            user_id=current_user.id,
            office_id=body.office_id,
            wsap_endpoint=body.wsap_endpoint,
            wsap_user_encrypted=encrypted_user,
            wsap_pass_encrypted=encrypted_pass,
            totp_secret_encrypted=encrypted_totp,
        )
        db.add(config)

    db.commit()
    return {"message": "Amadeus config saved"}


@router.get("/config/status")
def get_config_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = db.query(AmadeusConfig).filter(AmadeusConfig.user_id == current_user.id).first()
    return {
        "configured": config is not None,
        "office_id": config.office_id if config else None,
        "wsap_endpoint": config.wsap_endpoint if config else None,
        "last_synced_at": config.last_synced_at.isoformat() if config and config.last_synced_at else None,
    }


@router.get("/config")
def get_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = db.query(AmadeusConfig).filter(AmadeusConfig.user_id == current_user.id).first()
    if not config:
        raise HTTPException(status_code=404, detail="No Amadeus config found")

    return {
        "office_id": config.office_id,
        "wsap_endpoint": config.wsap_endpoint,
        "wsap_user": "****",
        "wsap_pass": "****",
        "totp_secret": "****" if config.totp_secret_encrypted else None,
        "last_synced_at": config.last_synced_at.isoformat() if config.last_synced_at else None,
    }
