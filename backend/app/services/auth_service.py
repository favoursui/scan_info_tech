"""
app/services/auth_service.py
"""
import asyncio
import logging
import random
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.account import Account
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.utils.email import (
    send_account_locked_email,
    send_verification_email,
    send_password_reset_otp,
)

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
LOCKOUT_MINUTES = 30
VERIFY_TOKEN_EXPIRE_HOURS = 1
OTP_EXPIRE_MINUTES = 5


def register_user(payload: UserCreate, db: Session, base_url: str) -> User:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=VERIFY_TOKEN_EXPIRE_HOURS)

    user = User(
        email=payload.email,
        username=payload.username,
        password=hash_password(payload.password),
        shipping_address=payload.shipping_address,
        is_verified=False,
        verification_token=token,
        verification_token_expires=expires,
    )
    db.add(user)
    db.flush()

    account = Account(user_id=user.id)
    db.add(account)
    db.commit()
    db.refresh(user)

    asyncio.ensure_future(
        send_verification_email(user.email, user.username, token, base_url)
    )

    return user


def verify_email(token: str, db: Session) -> dict:
    user = db.query(User).filter(User.verification_token == token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token",
        )

    now = datetime.now(timezone.utc)
    expires = user.verification_token_expires.replace(tzinfo=timezone.utc)

    if now > expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new one.",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already verified. Please login.",
        )

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    return {"detail": "Email verified successfully. You can now login."}


def resend_verification(email: str, db: Session, base_url: str) -> dict:
    user = db.query(User).filter(User.email == email).first()

    if not user or user.is_verified:
        return {"detail": "If that email is registered and unverified, a link has been sent."}

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=VERIFY_TOKEN_EXPIRE_HOURS)
    user.verification_token = token
    user.verification_token_expires = expires
    db.commit()

    asyncio.ensure_future(
        send_verification_email(user.email, user.username, token, base_url)
    )

    return {"detail": "If that email is registered and unverified, a link has been sent."}


def forgot_password(email: str, db: Session) -> dict:
    """Generate a 6-digit OTP and send it to the user's email."""
    user = db.query(User).filter(User.email == email).first()

    # Don't reveal whether email exists
    if not user or not user.is_verified:
        return {"detail": "If that email is registered, an OTP has been sent."}

    otp = str(random.randint(100000, 999999))
    expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)

    user.password_reset_otp = otp
    user.password_reset_otp_expires = expires
    db.commit()

    asyncio.ensure_future(
        send_password_reset_otp(user.email, user.username, otp)
    )

    return {"detail": "If that email is registered, an OTP has been sent."}


def reset_password(email: str, otp: str, new_password: str, db: Session) -> dict:
    """Verify OTP and set new password."""
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.password_reset_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    now = datetime.now(timezone.utc)
    expires = user.password_reset_otp_expires.replace(tzinfo=timezone.utc)

    if now > expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if user.password_reset_otp != otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Please check your email and try again.",
        )

    # All good — update password and clear OTP
    user.password = hash_password(new_password)
    user.password_reset_otp = None
    user.password_reset_otp_expires = None
    # Reset lockout in case they were locked
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    return {"detail": "Password reset successfully. You can now login."}


async def login_user(payload: UserLogin, db: Session) -> Token:
    user: User | None = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    now = datetime.now(timezone.utc)
    if user.locked_until:
        locked_until_aware = user.locked_until.replace(tzinfo=timezone.utc)
        if now < locked_until_aware:
            remaining = int((locked_until_aware - now).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to too many failed attempts. "
                       f"Try again in {remaining} minute(s).",
            )
        else:
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Please contact support.",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox.",
        )

    if not verify_password(payload.password, user.password):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= MAX_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            logger.info(">>> Scheduling lockout email for %s", user.email)
            asyncio.ensure_future(
                send_account_locked_email(user.email, user.username, LOCKOUT_MINUTES)
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Too many failed attempts. Account locked for {LOCKOUT_MINUTES} minutes. "
                       f"A notification has been sent to your email.",
            )

        db.commit()
        remaining_attempts = MAX_ATTEMPTS - user.failed_login_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials. {remaining_attempts} attempt(s) remaining before lockout.",
        )

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    token = create_access_token({"sub": user.id, "is_admin": user.is_admin})
    return Token(access_token=token)