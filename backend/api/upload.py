"""CSV upload endpoint — accepts ticket numbers, queues TWD lookups."""
import csv
import io
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, AmadeusConfig
from ..auth.dependencies import get_current_user
from ..config import settings
from ..logic.demo_data import generate_demo_ticket, build_stub_ticket
from ..tasks.sync import _upsert_ticket
from ..tasks.tickets import process_csv_ticket

router = APIRouter(prefix="/upload", tags=["upload"])

REQUIRED_COLUMN = "ticket_number"
OPTIONAL_COLUMNS = {"pnr_locator", "issue_date", "departure_date", "passenger_name"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    config = db.query(AmadeusConfig).filter(AmadeusConfig.user_id == current_user.id).first()
    if not config:
        raise HTTPException(status_code=400, detail="Amadeus config not set up before uploading")

    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

    try:
        text = content.decode("utf-8-sig")  # handle BOM
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if REQUIRED_COLUMN not in (reader.fieldnames or []):
        raise HTTPException(
            status_code=422,
            detail=f"CSV must contain a '{REQUIRED_COLUMN}' column",
        )

    queued = []
    skipped = []

    for row in reader:
        ticket_number = str(row.get(REQUIRED_COLUMN, "")).strip()
        if not _valid_ticket_number(ticket_number):
            skipped.append({"ticket_number": ticket_number, "reason": "invalid format"})
            continue

        extra = {col: row.get(col, "").strip() for col in OPTIONAL_COLUMNS if col in (reader.fieldnames or [])}

        if settings.DEMO_MODE:
            ticket_data = generate_demo_ticket(ticket_number, extra)
        else:
            ticket_data = build_stub_ticket(extra)

        _upsert_ticket(db, current_user.id, ticket_number, ticket_data)

        if not settings.DEMO_MODE:
            process_csv_ticket.delay(current_user.id, ticket_number, extra)

        queued.append(ticket_number)

    db.commit()

    return {
        "queued": len(queued),
        "skipped": len(skipped),
        "queued_ticket_numbers": queued[:50],
        "skipped_details": skipped[:20],
        "demo_mode": settings.DEMO_MODE,
    }


def _valid_ticket_number(value: str) -> bool:
    return value.isdigit() and len(value) == 13
