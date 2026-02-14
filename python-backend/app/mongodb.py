"""MongoDB read-only connection for syncing data from the Next.js app."""

from pymongo import MongoClient
from functools import lru_cache
from app.config import get_settings


@lru_cache()
def get_mongo_client() -> MongoClient:
    settings = get_settings()
    if not settings.mongodb_uri:
        raise ValueError("MONGODB_URI is not set")
    return MongoClient(settings.mongodb_uri)


def get_mongo_db():
    """Get the MongoDB database instance."""
    client = get_mongo_client()
    # The database name is typically in the URI, but default to 'maxis'
    return client.get_default_database() or client["maxis"]
