"""
app/services/auth_service.py
Handles user registration and login business logic.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.account import Account
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import hash_password, verify_password, create_access_token


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


def login_user(payload: UserLogin, db: Session) -> Token:
    user: User | None = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Please contact support.",
        )

    token = create_access_token({"sub": user.id, "is_admin": user.is_admin})
    return Token(access_token=token)