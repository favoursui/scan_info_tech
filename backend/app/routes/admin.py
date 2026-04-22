"""
app/routes/admin.py
Admin-only read endpoints: orders, users, products overview.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.order import OrderOut
from app.schemas.user import UserOut
from app.schemas.product import ProductOut
from app.services.order_service import get_all_orders
from app.services.product_service import get_products

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/orders", response_model=list[OrderOut])
def admin_list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """List all orders across every user (admin only)."""
    return get_all_orders(db, skip=skip, limit=limit)


@router.get("/users", response_model=list[UserOut])
def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """List all registered users (admin only)."""
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/products", response_model=list[ProductOut])
def admin_list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """List all products with full details (admin only)."""
    return get_products(db, skip=skip, limit=limit)
