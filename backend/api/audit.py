from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId

from ..models import AuditTrail, Ticket, User
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/audit-trail", tags=["audit"])


@router.get("/{ticket_id}")
async def get_audit_trail(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
):
    ticket = await Ticket.find_one(
        Ticket.id == PydanticObjectId(ticket_id),
        Ticket.tenant_id == current_user.id,
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    logs = await AuditTrail.find(
        AuditTrail.ticket_id == ticket.id
    ).sort(+AuditTrail.parsed_at).to_list()

    return [
        {
            "id": str(log.id),
            "command_used": log.command_used,
            "raw_response": log.raw_response,
            "parsed_at": log.parsed_at.isoformat(),
        }
        for log in logs
    ]
