"""
app/services/auth_service.py
Handles user registration and login business logic.
"""
from datetime import datetime, timedelta, timezone
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.account import Account
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.utils.email import send_account_locked_email

MAX_ATTEMPTS = 3
LOCKOUT_MINUTES = 30


def register_user(payload: UserCreate, db: Session) -> User:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        password=hash_password(payload.password),
        shipping_address=payload.shipping_address,
    )
    db.add(user)
    db.flush()

    account = Account(user_id=user.id)
    db.add(account)
    db.commit()
    db.refresh(user)
    return user


def login_user(payload: UserLogin, db: Session, background_tasks: BackgroundTasks) -> Token:
    user: User | None = db.query(User).filter(User.email == payload.email).first()

    # Unknown email — don't reveal whether account exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    #  Lockout check 
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
            # Lockout expired — reset
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()

    #  Suspension check 
    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Please contact support.",
        )

    #  Wrong password 
    if not verify_password(payload.password, user.password):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= MAX_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()

            # Send email in background — never blocks the response
            background_tasks.add_task(
                send_account_locked_email,
                user.email,
                user.username,
                LOCKOUT_MINUTES,
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

    #  Success — reset counters 
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    token = create_access_token({"sub": user.id, "is_admin": user.is_admin})
    return Token(access_token=token)