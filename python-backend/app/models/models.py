"""SQLAlchemy models for PostgreSQL tables."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ScheduledPost(Base):
    """Tracks scheduled post execution.

    Synced from MongoDB ScheduledPost collection.
    PostgreSQL handles the time-based execution logic.
    """
    __tablename__ = "scheduled_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mongo_id = Column(String(24), unique=True, index=True, nullable=True)
    linkedin_id = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    media = Column(Text, nullable=True)
    media_type = Column(String(50), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    posted = Column(Boolean, default=False, index=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AutomationRun(Base):
    """Tracks automation execution state.

    Synced from MongoDB Automation collection.
    PostgreSQL handles the scheduling logic (nextRun, frequency).
    """
    __tablename__ = "automation_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mongo_automation_id = Column(String(24), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)
    topic = Column(Text, nullable=True)
    tone = Column(String(50), nullable=True)
    length = Column(String(50), nullable=True)
    post_time = Column(String(10), nullable=True)  # HH:mm format
    frequency = Column(String(50), default="daily")
    custom_days = Column(JSON, nullable=True)  # Array of day numbers [0-6]
    is_active = Column(Boolean, default=True, index=True)
    selected_account_ids = Column(JSON, nullable=True)  # Array of MongoDB account IDs
    automate_images = Column(Boolean, default=False)
    username = Column(String(255), nullable=True)
    profile_image_url = Column(Text, nullable=True)
    next_run = Column(DateTime(timezone=True), nullable=True, index=True)
    last_run = Column(DateTime(timezone=True), nullable=True)
    run_count = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AnalyticsSnapshot(Base):
    """Caches real analytics data from LinkedIn API.

    Replaces the fake seeded analytics in the Next.js app.
    """
    __tablename__ = "analytics_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(String(24), nullable=False, index=True)
    platform = Column(String(50), nullable=False)
    followers = Column(Integer, default=0)
    views = Column(Integer, default=0)
    engagement = Column(Integer, default=0)
    snapshot_date = Column(DateTime(timezone=True), nullable=False)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
