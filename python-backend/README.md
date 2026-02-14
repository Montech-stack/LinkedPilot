# Python Backend for Maxis

FastAPI-based backend handling scheduling execution, automation execution, and analytics.

## Setup

```bash
cd python-backend
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## Environment

Copy `.env.example` to `.env` and fill in the values.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Database

PostgreSQL is required. Create a database and set `DATABASE_URL` in `.env`.

```bash
# Run migrations
alembic upgrade head
```
