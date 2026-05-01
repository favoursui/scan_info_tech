"""
Admin-only read endpoints and user management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.order import OrderOut
from app.schemas.user import UserOut
from app.schemas.product import ProductOut
from app.services.order_service import get_all_orders
from app.services.product_service import get_products
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])


#  Read endpoints 

@router.get("/orders", response_model=list[OrderOut])
def admin_list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return get_all_orders(db, skip=skip, limit=limit)


@router.get("/users", response_model=list[UserOut])
def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/products", response_model=list[ProductOut])
def admin_list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return get_products(db, skip=skip, limit=limit)


#  User management 

class UserLookup(BaseModel):
    username: str | None = None
    email: str | None = None


def _find_user(lookup: UserLookup, db: Session) -> User:
    if not lookup.username and not lookup.email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either username or email",
        )
    user = None
    if lookup.username:
        user = db.query(User).filter(User.username == lookup.username).first()
    elif lookup.email:
        user = db.query(User).filter(User.email == lookup.email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/make-admin", response_model=UserOut)
def make_admin(
    lookup: UserLookup,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Promote a user to admin by username or email."""
    user = _find_user(lookup, db)

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already an admin",
        )
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{user.username} is already an admin",
        )

    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/suspend", response_model=UserOut)
def suspend_user(
    lookup: UserLookup,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Suspend a user account by username or email."""
    user = _find_user(lookup, db)

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot suspend your own account",
        )
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts cannot be suspended",
        )
    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{user.username} is already suspended",
        )

    user.is_suspended = True
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/reactivate", response_model=UserOut)
def reactivate_user(
    lookup: UserLookup,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Reactivate a suspended user account by username or email."""
    user = _find_user(lookup, db)

    if not user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{user.username} is not suspended",
        )

    user.is_suspended = False
    db.commit()
    db.refresh(user)
    return user