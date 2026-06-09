from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .config import settings


async def init_db() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    from .models import User, Ticket, RefundRule, AuditTrail, SyncLog, AmadeusConfig
    db_name = settings.MONGODB_URL.rsplit("/", 1)[-1].split("?")[0] or "tickettrack"
    await init_beanie(
        database=client[db_name],
        document_models=[User, Ticket, RefundRule, AuditTrail, SyncLog, AmadeusConfig],
    )
