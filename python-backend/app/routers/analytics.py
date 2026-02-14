"""API routes for analytics."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import AnalyticsSnapshot

router = APIRouter(tags=["analytics"])


@router.get("/analytics/{account_id}")
def get_analytics(
    account_id: str,
    db: Session = Depends(get_db),
):
    """Get analytics snapshots for an account.

    Returns the latest snapshot and historical data.
    """
    latest = (
        db.query(AnalyticsSnapshot)
        .filter(AnalyticsSnapshot.account_id == account_id)
        .order_by(AnalyticsSnapshot.snapshot_date.desc())
        .first()
    )

    if not latest:
        return {
            "account_id": account_id,
            "stats": {
                "followers": 0,
                "views": 0,
                "engagement": 0,
                "graphData": [],
            },
        }

    # Get last 7 days of data for graph
    history = (
        db.query(AnalyticsSnapshot)
        .filter(AnalyticsSnapshot.account_id == account_id)
        .order_by(AnalyticsSnapshot.snapshot_date.desc())
        .limit(7)
        .all()
    )

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    graph_data = []
    for snapshot in reversed(history):
        day_name = days[snapshot.snapshot_date.weekday()]
        graph_data.append({
            "day": day_name,
            "views": snapshot.views,
            "likes": snapshot.engagement,
        })

    return {
        "account_id": account_id,
        "platform": latest.platform,
        "stats": {
            "followers": latest.followers,
            "views": latest.views,
            "engagement": latest.engagement,
            "graphData": graph_data,
        },
    }
