from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr
import bcrypt

from ..models import User
from ..auth.dependencies import require_admin

router = APIRouter(prefix="/users", tags=["users"])


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"


@router.get("")
async def list_users(current_user: User = Depends(require_admin)):
    users = await User.find_all().to_list()
    return [
        {"id": str(u.id), "email": u.email, "role": u.role, "created_at": u.created_at.isoformat()}
        for u in users
    ]


@router.post("")
async def create_user(
    body: CreateUserRequest,
    current_user: User = Depends(require_admin),
):
    if await User.find_one(User.email == body.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if body.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(rounds=12)).decode()
    user = User(email=body.email, password_hash=hashed, role=body.role)
    await user.insert()
    return {"id": str(user.id), "email": user.email, "role": user.role}


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    if user_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.delete()
    return {"message": f"User {user.email} deleted"}
