from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .base import Base


class AmadeusConfig(Base):
    __tablename__ = "amadeus_config"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    office_id = Column(String(100), nullable=False)
    wsap_endpoint = Column(String(512), nullable=True)   # e.g. https://production.webservices.amadeus.com/1ASIWSAS1ASI
    wsap_user_encrypted = Column(String(512), nullable=False)
    wsap_pass_encrypted = Column(String(512), nullable=False)
    totp_secret_encrypted = Column(String(512), nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
