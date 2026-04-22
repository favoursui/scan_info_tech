"""
app/routes/cart.py
Cart endpoints – add and update are public (guest-friendly).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.cart import CartAdd, CartUpdateQty
from app.services.cart_service import add_to_cart, update_cart_quantity

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post("/add", status_code=201)
def add_item(payload: CartAdd, db: Session = Depends(get_db)):
    """
    Add a product to the cart.
    Pass `user_id` for authenticated users, omit for guest sessions.
    """
    cart = add_to_cart(payload, db)
    return {
        "detail": "Item added to cart",
        "cart_id": cart.id,
        "product_id": cart.product_id,
        "quantity": cart.quantity,
    }


@router.patch("/update-qty")
def update_qty(payload: CartUpdateQty, db: Session = Depends(get_db)):
    """
    Update cart item quantity.
    Setting quantity to 0 removes the item entirely.
    """
    return update_cart_quantity(payload, user_id=None, db=db)
