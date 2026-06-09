from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
import bcrypt

from ..models import User
from ..auth.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str


@router.post("/login", response_model=LoginResponse)
async def login(request: Request, body: LoginRequest):
    user = await User.find_one(User.email == body.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id), user.email, user.role)
    return LoginResponse(access_token=token, user_id=str(user.id), email=user.email, role=user.role)


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
