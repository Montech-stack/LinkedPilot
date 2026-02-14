"""MongoDB → PostgreSQL sync service.

Pulls new/updated schedule and automation data from MongoDB
and syncs it into PostgreSQL for execution tracking.
"""

import logging
from datetime import datetime, timezone
from bson import ObjectId
from sqlalchemy.orm import Session

from app.models.models import ScheduledPost, AutomationRun
from app.mongodb import get_mongo_db
from app.services.automation_executor import calculate_next_run

logger = logging.getLogger(__name__)


def sync_scheduled_posts(db: Session) -> dict:
    """Sync ScheduledPost documents from MongoDB to PostgreSQL."""
    mongo_db = get_mongo_db()

    # Get all unposted posts from MongoDB
    mongo_posts = list(
        mongo_db.scheduledposts.find({"posted": False}).sort("scheduledAt", 1)
    )

    synced = 0
    skipped = 0

    for mp in mongo_posts:
        mongo_id = str(mp["_id"])

        # Check if already synced
        existing = db.query(ScheduledPost).filter(ScheduledPost.mongo_id == mongo_id).first()
        if existing:
            # Update if content changed
            if existing.content != mp.get("content", ""):
                existing.content = mp.get("content", "")
                existing.scheduled_at = mp.get("scheduledAt")
                existing.media = mp.get("media")
                existing.media_type = mp.get("mediaType")
                db.commit()
                synced += 1
            else:
                skipped += 1
            continue

        # Create new
        post = ScheduledPost(
            mongo_id=mongo_id,
            linkedin_id=mp.get("linkedinId"),
            content=mp.get("content", ""),
            media=mp.get("media"),
            media_type=mp.get("mediaType"),
            scheduled_at=mp.get("scheduledAt"),
            posted=mp.get("posted", False),
        )
        db.add(post)
        synced += 1

    db.commit()
    logger.info(f"Synced {synced} scheduled posts, skipped {skipped}")
    return {"synced": synced, "skipped": skipped}


def sync_automations(db: Session) -> dict:
    """Sync Automation documents from MongoDB to PostgreSQL."""
    mongo_db = get_mongo_db()

    # Get all active automations
    mongo_automations = list(mongo_db.automations.find({"isActive": True}))

    synced = 0
    skipped = 0

    for ma in mongo_automations:
        mongo_id = str(ma["_id"])

        existing = db.query(AutomationRun).filter(
            AutomationRun.mongo_automation_id == mongo_id
        ).first()

        if existing:
            # Update configuration fields
            existing.title = ma.get("title", "")
            existing.topic = ma.get("topic", "")
            existing.tone = ma.get("tone", "professional")
            existing.length = ma.get("length", "medium")
            existing.post_time = ma.get("postTime", "09:00")
            existing.frequency = ma.get("frequency", "daily")
            existing.custom_days = ma.get("customDays", [])
            existing.is_active = ma.get("isActive", True)
            existing.selected_account_ids = [
                str(aid) for aid in ma.get("selectedAccounts", [])
            ]
            existing.automate_images = ma.get("automateImages", False)
            existing.username = ma.get("username")
            existing.profile_image_url = ma.get("profileImageUrl")

            # Only recalculate next_run if it's not set or config changed
            if not existing.next_run:
                existing.next_run = calculate_next_run(
                    existing.post_time or "09:00",
                    existing.frequency or "daily",
                    existing.custom_days,
                )

            db.commit()
            synced += 1
            continue

        # Create new automation run entry
        post_time = ma.get("postTime", "09:00")
        frequency = ma.get("frequency", "daily")
        custom_days = ma.get("customDays", [])

        run = AutomationRun(
            mongo_automation_id=mongo_id,
            title=ma.get("title", ""),
            topic=ma.get("topic", ""),
            tone=ma.get("tone", "professional"),
            length=ma.get("length", "medium"),
            post_time=post_time,
            frequency=frequency,
            custom_days=custom_days,
            is_active=ma.get("isActive", True),
            selected_account_ids=[
                str(aid) for aid in ma.get("selectedAccounts", [])
            ],
            automate_images=ma.get("automateImages", False),
            username=ma.get("username"),
            profile_image_url=ma.get("profileImageUrl"),
            next_run=ma.get("nextRun") or calculate_next_run(
                post_time, frequency, custom_days
            ),
            last_run=ma.get("lastRun"),
            run_count=ma.get("count", 0),
        )
        db.add(run)
        synced += 1

    db.commit()
    logger.info(f"Synced {synced} automations, skipped {skipped}")
    return {"synced": synced, "skipped": skipped}


def sync_post_back_to_mongo(db: Session, post: ScheduledPost):
    """After publishing, sync the posted status back to MongoDB."""
    if not post.mongo_id:
        return

    mongo_db = get_mongo_db()
    mongo_db.scheduledposts.update_one(
        {"_id": ObjectId(post.mongo_id)},
        {"$set": {"posted": True}},
    )
    logger.info(f"Synced posted status back to MongoDB for {post.mongo_id}")
