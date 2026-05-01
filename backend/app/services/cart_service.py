"""
Cart operations for authenticated and guest users.
"""
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.cart import Cart
from app.models.guest import Guest
from app.models.product import Product
from app.schemas.cart import CartAdd, CartUpdateQty


def _ensure_product(product_id: int, quantity: int, db: Session) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.stock_quantity < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {product.stock_quantity}",
        )
    return product


def add_to_cart(payload: CartAdd, db: Session) -> Cart:
    _ensure_product(payload.product_id, payload.quantity, db)

    # If an identical cart row already exists, increment instead
    existing = (
        db.query(Cart)
        .filter(Cart.user_id == payload.user_id, Cart.product_id == payload.product_id)
        .first()
    )
    if existing:
        existing.quantity += payload.quantity
        db.commit()
        db.refresh(existing)
        return existing

    cart = Cart(
        user_id=payload.user_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def update_cart_quantity(payload: CartUpdateQty, user_id: int | None, db: Session) -> dict:
    cart = db.get(Cart, payload.cart_id)
    if not cart or (user_id and cart.user_id != user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    if payload.quantity == 0:
        db.delete(cart)
        db.commit()
        return {"detail": "Cart item removed"}

    _ensure_product(cart.product_id, payload.quantity, db)
    cart.quantity = payload.quantity
    db.commit()
    db.refresh(cart)
    return {"detail": "Quantity updated", "cart_id": cart.id, "quantity": cart.quantity}


def create_guest_session(db: Session) -> str:
    """Create a guest record and return its UUID string."""
    guest_id = str(uuid.uuid4())
    guest = Guest(guest_id=guest_id)
    db.add(guest)
    db.commit()
    return guest_id
