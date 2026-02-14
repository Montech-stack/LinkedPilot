"""API routes for schedule and automation execution."""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import get_settings
from app.services.schedule_executor import execute_due_schedules
from app.services.automation_executor import execute_due_automations
from app.services.sync import sync_scheduled_posts, sync_automations
from app.models.models import AutomationRun


router = APIRouter(tags=["execution"])


def verify_cron_secret(x_cron_secret: str = Header(default="")):
    """Verify the cron secret for authenticated endpoints."""
    settings = get_settings()
    if settings.vercel_cron_secret and x_cron_secret != settings.vercel_cron_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")


@router.post("/sync-schedules")
def sync_schedules_endpoint(
    db: Session = Depends(get_db),
    _auth=Depends(verify_cron_secret),
):
    """Sync scheduled posts from MongoDB to PostgreSQL.

    Called by Next.js after a schedule is created/updated/deleted.
    """
    result = sync_scheduled_posts(db)
    return {"success": True, **result}


@router.post("/sync-automations")
def sync_automations_endpoint(
    db: Session = Depends(get_db),
    _auth=Depends(verify_cron_secret),
):
    """Sync automations from MongoDB to PostgreSQL.

    Called by Next.js after an automation is created/updated/deleted.
    """
    result = sync_automations(db)
    return {"success": True, **result}


@router.post("/execute-schedules")
async def execute_schedules_endpoint(
    db: Session = Depends(get_db),
    _auth=Depends(verify_cron_secret),
):
    """Find due scheduled posts and publish them.

    Triggered by APScheduler every 5 minutes, or manually.
    """
    # First sync from MongoDB
    sync_scheduled_posts(db)

    # Then execute
    result = await execute_due_schedules(db)
    return {"success": True, **result}


@router.post("/execute-automations")
async def execute_automations_endpoint(
    db: Session = Depends(get_db),
    _auth=Depends(verify_cron_secret),
):
    """Find due automations, generate content, and post.

    Triggered by APScheduler every 15 minutes, or manually.
    """
    # First sync from MongoDB
    sync_automations(db)

    # Then execute
    result = await execute_due_automations(db)
    return {"success": True, **result}


@router.get("/logs")
def get_execution_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    _auth=Depends(verify_cron_secret),
):
    """Fetch recent automation execution logs."""
    logs = (
        db.query(AutomationRun)
        .order_by(AutomationRun.run_at.desc())
        .limit(limit)
        .all()
    )
    return logs
