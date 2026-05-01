"""
Protected order endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.order import OrderOut, CheckoutRequest
from app.services.order_service import checkout, get_order_history

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/checkout")
def place_order(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Checkout a cart item. Returns a success message with order details."""
    return checkout(payload.cart_id, current_user, db)


@router.get("/history", response_model=list[OrderOut])
def order_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated user's full order history, newest first."""
    return get_order_history(current_user, db)