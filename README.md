# TicketTrack

**Airline Ticket Audit & Refund Recovery Platform**

TicketTrack automates the discovery and recovery of refundable airline tickets by integrating with Amadeus GDS, applying configurable refund rules, and surfacing actionable insights through a clean dashboard.

---

## Features

- **Amadeus GDS Integration** — Parses and syncs ticket data directly from the Amadeus terminal
- **Automated Refund Detection** — Applies configurable rules to categorise tickets as refundable, partially refundable, or non-refundable
- **Ticket Upload** — Bulk-import tickets via file upload as an alternative to live sync
- **Audit Trail** — Full history of every status change and action taken on a ticket
- **Role-based Access** — JWT-authenticated API with admin and agent roles
- **Rate Limiting** — Built-in API rate limiting via SlowAPI
- **AES-256 Encryption** — Sensitive credential fields encrypted at rest
- **Background Workers** — Celery + Redis for async sync jobs and scheduled tasks
- **Interactive Dashboard** — React frontend with live KPIs, filters, and ticket detail drill-down
- **Demo Mode** — Explore the UI with pre-loaded sample data without a live Amadeus connection

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI 0.115, Python 3.12 |
| Database | PostgreSQL 16 + SQLAlchemy 2 + Alembic |
| Task Queue | Celery 5.4 + Redis 7 |
| Auth | PyJWT + bcrypt + TOTP (pyotp) |
| Frontend | React 18, TailwindCSS 3, React Query 5 |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
ticketTracker/
├── backend/
│   ├── amadeus/          # Amadeus GDS parser, session, WSAP client
│   ├── api/              # FastAPI route handlers (auth, tickets, sync, refund_rules, audit, upload, users)
│   ├── auth/             # JWT + dependency injection
│   ├── logic/            # Refund categorisation & demo data
│   ├── models/           # SQLAlchemy ORM models
│   ├── tasks/            # Celery app, sync tasks, ticket tasks
│   ├── utils/            # AES encryption helpers
│   ├── alembic/          # Database migrations
│   ├── scripts/          # CLI helpers (create_admin, amadeus_auth)
│   ├── config.py         # Pydantic settings
│   ├── main.py           # FastAPI app entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios API client
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context (Demo, GuideMode, Tour)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route-level page components
│   │   └── data/         # Demo fixtures & tour steps
│   └── package.json
├── docker-compose.yml
├── .env                  # Local secrets (never committed)
└── SETUP.md
```

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ *(frontend dev only)*
- Python 3.12+ *(backend dev only)*

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — set a strong SECRET_KEY (32+ chars) and AES_KEY (exactly 32 chars)
```

### 2. Start infrastructure

```bash
docker compose up -d db redis
```

### 3. Run migrations

```bash
cd backend
pip install -r requirements.txt
alembic -c alembic.ini upgrade head
```

### 4. Create admin user

```bash
python -m backend.scripts.create_admin admin@example.com yourpassword
```

### 5. Start the API

```bash
uvicorn backend.main:app --reload --port 8000
```

### 6. Start Celery workers

```bash
# In separate terminals:
celery -A backend.tasks.celery_app.celery_app worker --loglevel=info
celery -A backend.tasks.celery_app.celery_app beat --loglevel=info
```

### 7. Start the frontend

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

---

## Full Docker Deploy

```bash
docker compose up --build
docker compose exec api alembic -c backend/alembic.ini upgrade head
docker compose exec api python -m backend.scripts.create_admin admin@example.com password
```

App will be available at `http://localhost:3000`, API at `http://localhost:8000`.

---

## API Reference

Interactive Swagger docs are available at `http://localhost:8000/docs` once the API is running.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Obtain JWT access token |
| GET | `/tickets` | List tickets with filters |
| POST | `/tickets/upload` | Bulk upload tickets from file |
| POST | `/sync` | Trigger Amadeus sync job |
| GET | `/refund-rules` | List refund rules |
| POST | `/refund-rules` | Create a refund rule |
| GET | `/audit` | Fetch audit trail entries |
| GET | `/health` | Health check |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing key (32+ random chars) |
| `AES_KEY` | AES-256 encryption key (exactly 32 chars) |
| `ACCESS_TOKEN_EXPIRE_HOURS` | JWT TTL in hours (default: 8) |

---

## License

Private — all rights reserved.
