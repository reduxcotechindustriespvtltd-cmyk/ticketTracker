from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from .rate_limiter import limiter
from .config import settings
from .api import auth, tickets, sync, amadeus, refund_rules, audit, upload, users

app = FastAPI(
    title="TicketTrack API",
    description="Airline Ticket Audit & Refund Recovery Platform",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(sync.router)
app.include_router(amadeus.router)
app.include_router(refund_rules.router)
app.include_router(audit.router)
app.include_router(upload.router)
app.include_router(users.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "TicketTrack API"}
