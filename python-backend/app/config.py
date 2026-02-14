"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Settings loaded from .env file or environment variables."""

    # PostgreSQL
    database_url: str = "postgresql://user:password@localhost:5432/maxis"

    # MongoDB (read-only for syncing schedule/automation data)
    mongodb_uri: str = ""

    # LinkedIn API
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""

    # Gemini API
    gemini_api_key: str = ""

    # Vercel cron secret (to authenticate inbound calls from Next.js)
    vercel_cron_secret: str = ""

    # Next.js app URL
    nextjs_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
