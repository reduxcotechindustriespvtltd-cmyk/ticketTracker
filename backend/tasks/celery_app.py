from celery import Celery
from ..config import settings

celery_app = Celery(
    "tickettrack",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["backend.tasks.sync", "backend.tasks.tickets"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        "retry-airport-control-every-hour": {
            "task": "backend.tasks.tickets.retry_airport_control_tickets",
            "schedule": 3600.0,
        },
        "check-expiring-tickets-daily": {
            "task": "backend.tasks.tickets.check_expiring_tickets",
            "schedule": 86400.0,
        },
    },
)
