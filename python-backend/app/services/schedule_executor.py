"""Schedule executor — finds due posts and publishes them.

This replaces check-scheduled-posts and linkedin/cron in Next.js.
Runs on APScheduler every 5 minutes.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.models import ScheduledPost
from app.services.linkedin import publish_scheduled_post

logger = logging.getLogger(__name__)


async def execute_due_schedules(db: Session) -> dict:
    """Find all due scheduled posts and publish them to LinkedIn.

    Returns a summary of processed posts.
    """
    now = datetime.now(timezone.utc)

    due_posts = (
        db.query(ScheduledPost)
        .filter(
            ScheduledPost.posted == False,
            ScheduledPost.scheduled_at <= now,
        )
        .order_by(ScheduledPost.scheduled_at.asc())
        .all()
    )

    logger.info(f"Found {len(due_posts)} due scheduled posts")

    processed = 0
    errors = 0

    for post in due_posts:
        try:
            if not post.linkedin_id:
                post.error = "No LinkedIn member ID on post"
                db.commit()
                errors += 1
                continue

            result = await publish_scheduled_post(
                linkedin_id=post.linkedin_id,
                content=post.content,
                media=post.media,
                media_type=post.media_type,
            )

            post.posted = True
            post.error = None
            db.commit()
            processed += 1
            logger.info(f"Published scheduled post {post.id} -> {result}")

        except Exception as e:
            logger.error(f"Failed to publish post {post.id}: {e}")
            post.error = str(e)
            db.commit()
            errors += 1

    return {
        "total_due": len(due_posts),
        "processed": processed,
        "errors": errors,
    }
