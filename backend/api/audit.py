from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditTrail, Ticket, User
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/audit-trail", tags=["audit"])


@router.get("/{ticket_id}")
def get_audit_trail(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id, Ticket.tenant_id == current_user.id
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    logs = (
        db.query(AuditTrail)
        .filter(AuditTrail.ticket_id == ticket_id)
        .order_by(AuditTrail.parsed_at.asc())
        .all()
    )
    return [
        {
            "id": log.id,
            "command_used": log.command_used,
            "raw_response": log.raw_response,
            "parsed_at": log.parsed_at.isoformat(),
        }
        for log in logs
    ]
