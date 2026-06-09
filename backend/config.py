from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017/tickettrack"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "CHANGE-ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 8
    AES_KEY: str = "CHANGE-ME-32-BYTES-PLACEHOLDER!!"
    DEMO_MODE: bool = False
    CORS_ORIGINS: str = "http://localhost:3000,https://tickettracker-production.up.railway.app"

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
