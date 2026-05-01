from fastapi import APIRouter, Depends, Query, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.auth_service import (
    register_user,
    login_user,
    verify_email,
    resend_verification,
    forgot_password,
    reset_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    return register_user(payload, db, base_url)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    return await login_user(payload, db)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.get("/verify")
def verify(token: str = Query(...), db: Session = Depends(get_db)):
    return verify_email(token, db)


@router.post("/resend-verification")
async def resend(email: EmailStr, request: Request, db: Session = Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    return resend_verification(email, db, base_url)


@router.post("/forgot-password")
async def forgot(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password(payload.email, db)


@router.post("/reset-password")
def reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_password(payload.email, payload.otp, payload.new_password, db)