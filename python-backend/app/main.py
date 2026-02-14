"""FastAPI application entry point.

Starts the server with APScheduler for periodic job execution.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import engine, Base, SessionLocal
from app.routers import execution, analytics
from app.services.schedule_executor import execute_due_schedules
from app.services.automation_executor import execute_due_automations
from app.services.sync import sync_scheduled_posts, sync_automations

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# APScheduler instance
scheduler = AsyncIOScheduler()


async def scheduled_execute_schedules():
    """APScheduler job: execute due scheduled posts every 5 minutes."""
    logger.info("⏰ Running scheduled post execution...")
    db = SessionLocal()
    try:
        sync_scheduled_posts(db)
        result = await execute_due_schedules(db)
        logger.info(f"Schedule execution result: {result}")
    except Exception as e:
        logger.error(f"Schedule execution failed: {e}")
    finally:
        db.close()


async def scheduled_execute_automations():
    """APScheduler job: execute due automations every 15 minutes."""
    logger.info("🤖 Running automation execution...")
    db = SessionLocal()
    try:
        sync_automations(db)
        result = await execute_due_automations(db)
        logger.info(f"Automation execution result: {result}")
    except Exception as e:
        logger.error(f"Automation execution failed: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: start scheduler on startup, stop on shutdown."""
    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created/verified")

    # Start APScheduler
    scheduler.add_job(
        scheduled_execute_schedules,
        "interval",
        minutes=5,
        id="execute_schedules",
        replace_existing=True,
    )
    scheduler.add_job(
        scheduled_execute_automations,
        "interval",
        minutes=15,
        id="execute_automations",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("🚀 APScheduler started with jobs: execute_schedules (5min), execute_automations (15min)")

    yield

    # Shutdown
    scheduler.shutdown()
    logger.info("⛔ APScheduler stopped")


# Create FastAPI app
app = FastAPI(
    title="Maxis Python Backend",
    description="Handles scheduling execution, automation execution, and analytics for the Maxis app.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(execution.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "service": "Maxis Python Backend",
        "status": "running",
        "scheduler": "active" if scheduler.running else "stopped",
        "jobs": [
            {"id": job.id, "next_run": str(job.next_run_time)}
            for job in scheduler.get_jobs()
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok"}
