"""
app/routes/orders.py
Protected order endpoints – checkout and order history.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.order import OrderOut, CheckoutRequest
from app.services.order_service import checkout, get_order_history

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout", response_model=OrderOut, status_code=201)
def place_order(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Checkout a cart item.
    Confirms the order, deducts stock, and records a transaction.
    """
    return checkout(payload.cart_id, current_user, db)


@router.get("/history", response_model=list[OrderOut])
def order_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated user's full order history, newest first."""
    return get_order_history(current_user, db)
