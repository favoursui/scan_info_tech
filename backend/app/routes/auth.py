"""
app/routes/auth.py
"""
from fastapi import APIRouter, Depends, Query, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserOut, UserLogin, Token
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
    """Register a new user. A verification email is sent immediately."""
    base_url = str(request.base_url).rstrip("/")
    return register_user(payload, db, base_url)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login. Account must be verified first."""
    return await login_user(payload, db)


@router.get("/verify")
def verify(token: str = Query(...), db: Session = Depends(get_db)):
    """Verify email from the link sent after registration."""
    return verify_email(token, db)


@router.post("/resend-verification")
async def resend(email: EmailStr, request: Request, db: Session = Depends(get_db)):
    """Resend verification email if the previous token expired."""
    base_url = str(request.base_url).rstrip("/")
    return resend_verification(email, db, base_url)


@router.post("/forgot-password")
async def forgot(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a 6-digit OTP to reset your password."""
    return forgot_password(payload.email, db)


@router.post("/reset-password")
def reset(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using the OTP received via email."""
    return reset_password(payload.email, payload.otp, payload.new_password, db)