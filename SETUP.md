# TicketTrack — Quick Start

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend dev)
- Python 3.12+ (for local backend dev)

---

## 1. Start Infrastructure (Docker)

```bash
# From project root
docker compose up -d db redis
```

## 2. Run Migrations

```bash
cd backend
pip install -r requirements.txt
playwright install chromium

# From project root (so package is importable)
cd /path/to/ticketTracker
alembic -c backend/alembic.ini upgrade head
```

## 3. Create Admin User

```bash
python -m backend.scripts.create_admin admin@example.com yourpassword
```

## 4. Start the API

```bash
uvicorn backend.main:app --reload --port 8000
```

## 5. Start Celery Worker + Beat

```bash
# Worker (in separate terminal)
celery -A backend.tasks.celery_app.celery_app worker --loglevel=info

# Beat scheduler (in separate terminal)
celery -A backend.tasks.celery_app.celery_app beat --loglevel=info
```

## 6. Start Frontend

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

---

## Full Docker Deploy

```bash
# Edit .env — set real SECRET_KEY and AES_KEY
docker compose up --build
```

Then run migrations and create admin from inside the container:
```bash
docker compose exec api alembic -c backend/alembic.ini upgrade head
docker compose exec api python -m backend.scripts.create_admin admin@example.com password
```

---

## API Docs
Visit `http://localhost:8000/docs` for the auto-generated Swagger UI.

---

## Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing key (32+ chars random) |
| `AES_KEY` | AES-256 encryption key (exactly 32 chars) |
| `ACCESS_TOKEN_EXPIRE_HOURS` | JWT TTL (default: 8) |

---

## Saturday Amadeus Session
After your session with the real Amadeus terminal:
1. Update regex patterns in `backend/amadeus/parser.py`
2. Update the CSS selectors in `backend/amadeus/session.py` to match actual portal layout
3. Run a test sync with a single known ticket number to validate parsing
