"""Automation executor — generates content and posts automatically.

This replaces run-automations in Next.js.
Runs on APScheduler every 15 minutes.
"""

import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.models import AutomationRun
from app.services.gemini import generate_content, parse_json_response
from app.services.linkedin import publish_scheduled_post, get_linkedin_user
from app.mongodb import get_mongo_db

logger = logging.getLogger(__name__)


def calculate_next_run(
    post_time: str,
    frequency: str = "daily",
    custom_days: list[int] | None = None
) -> datetime:
    """Calculate the next run time based on frequency and post time.

    Mirrors the calculateNextRun logic from automations/route.ts.
    """
    hours, minutes = map(int, post_time.split(":"))
    now = datetime.now(timezone.utc)
    next_run = now.replace(hour=hours, minute=minutes, second=0, microsecond=0)

    # If time already passed today, start from tomorrow
    if next_run < now:
        next_run += timedelta(days=1)

    if frequency == "weekdays":
        day_of_week = next_run.weekday()  # 0=Mon, 6=Sun
        if day_of_week == 5:  # Saturday -> Monday
            next_run += timedelta(days=2)
        elif day_of_week == 6:  # Sunday -> Monday
            next_run += timedelta(days=1)

    elif frequency == "weekly":
        day_of_week = next_run.weekday()
        days_until_monday = (7 - day_of_week) % 7 or 7
        next_run += timedelta(days=days_until_monday)

    elif frequency == "custom" and custom_days:
        sorted_days = sorted(custom_days)
        current_day = next_run.weekday()
        target_day = None

        for d in sorted_days:
            if d >= current_day:
                target_day = d
                break

        if target_day is None:
            target_day = sorted_days[0]
            next_run += timedelta(days=(7 - current_day + target_day))
        elif target_day > current_day:
            next_run += timedelta(days=(target_day - current_day))

    return next_run


def build_automation_prompt(topic: str, tone: str, length: str) -> str:
    """Build a content generation prompt for automation."""
    word_count = {
        "short": "50-100 words",
        "medium": "100-200 words",
        "long": "200-300 words",
    }.get(length, "100-200 words")

    now = datetime.now(timezone.utc)

    return f"""
Generate 1 fresh, original, deeply engaging LinkedIn post using a {tone} tone based on the idea: "{topic}".

STRICT RULES:
1. Start with a sharp, emotional, bold, or curiosity-driven hook.
2. Use fictional analogy characters to illustrate points (e.g., "Take Mr. Scofield...", "Imagine Sarah, a designer...").
3. Show a clear mindset shift or discovery.
4. Use short paragraphs for readability.
5. Include 2-4 actionable points using hyphens (NOT numbered lists).
6. Use 3-8 emojis naturally.
7. End with a comment-provoking question.
8. Add 3-5 hashtags at the bottom.

LENGTH: {word_count}
No markdown. No asterisks. No repetitive AI patterns.

Date: {now.strftime('%B %d, %Y')}

OUTPUT FORMAT:
Return ONLY valid JSON array with 1 object:
[
  {{
    "id": "1",
    "content": "full post text"
  }}
]
"""


async def execute_due_automations(db: Session) -> dict:
    """Find all due automations, generate content, and post.

    Returns a summary of processed automations.
    """
    now = datetime.now(timezone.utc)

    due_automations = (
        db.query(AutomationRun)
        .filter(
            AutomationRun.is_active == True,
            AutomationRun.next_run <= now,
        )
        .all()
    )

    logger.info(f"Found {len(due_automations)} due automations")

    processed = 0
    errors = 0

    for automation in due_automations:
        try:
            # Get linked social accounts from MongoDB
            mongo_db = get_mongo_db()
            account_ids = automation.selected_account_ids or []

            if not account_ids:
                logger.warning(f"Automation {automation.id} has no selected accounts")
                automation.error = "No accounts selected"
                db.commit()
                errors += 1
                continue

            # Generate content
            prompt = build_automation_prompt(
                topic=automation.topic or "professional growth",
                tone=automation.tone or "professional",
                length=automation.length or "medium",
            )

            raw_content = await generate_content(prompt, max_tokens=3000)
            posts = parse_json_response(raw_content)

            if not posts:
                raise ValueError("No posts generated")

            content = posts[0].get("content", "")
            if not content:
                raise ValueError("Generated post has no content")

            logger.info(f"Generated content ({len(content)} chars) for automation {automation.id}")

            # Post to each account
            post_success = True
            for account_id in account_ids:
                account = mongo_db.socialaccounts.find_one({"_id": account_id})
                if not account or not account.get("connected"):
                    logger.warning(f"Account {account_id} not found or not connected")
                    continue

                if account.get("platform", "").lower() == "linkedin":
                    linkedin_id = account.get("linkedinId")
                    if not linkedin_id:
                        logger.warning(f"Account {account_id} has no linkedinId")
                        continue

                    try:
                        result = await publish_scheduled_post(
                            linkedin_id=linkedin_id,
                            content=content,
                        )
                        logger.info(f"Posted to LinkedIn account {account_id}: {result}")
                    except Exception as post_err:
                        logger.error(f"Failed to post to account {account_id}: {post_err}")
                        post_success = False

            if post_success:
                automation.last_run = now
                automation.run_count = (automation.run_count or 0) + 1
                automation.next_run = calculate_next_run(
                    automation.post_time or "09:00",
                    automation.frequency or "daily",
                    automation.custom_days,
                )
                automation.error = None
                logger.info(f"Automation {automation.id} completed, next run: {automation.next_run}")
            else:
                automation.error = "Some posts failed"

            db.commit()
            processed += 1

        except Exception as e:
            logger.error(f"Automation {automation.id} failed: {e}")
            automation.error = str(e)
            db.commit()
            errors += 1

    return {
        "total_due": len(due_automations),
        "processed": processed,
        "errors": errors,
    }
