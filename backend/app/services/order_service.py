"""
app/services/order_service.py
Checkout and order history logic.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.cart import Cart
from app.models.order import Order, OrderStatus
from app.models.transaction import Transaction
from app.models.user import User


def checkout(cart_id: int, user: User, db: Session) -> dict:
    cart = db.get(Cart, cart_id)
    if not cart or cart.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found or does not belong to you",
        )

    product = cart.product
    if product.stock_quantity < cart.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {product.stock_quantity}",
        )

    total = product.price * cart.quantity

    order = Order(
        product_id=product.id,
        user_id=user.id,
        amount=total,
        quantity=cart.quantity,
        unit_price=product.price,
        order_status=OrderStatus.CONFIRMED.value,
    )
    db.add(order)
    db.flush()

    # Deduct stock
    product.stock_quantity -= cart.quantity

    # Record transaction
    transaction = Transaction(order_id=order.id, payment_id=None)
    db.add(transaction)

    # Remove cart item
    db.delete(cart)
    db.commit()

    return {
        "message": "Checkout successful",
        "order_id": order.id,
        "product": product.name,
        "quantity": order.quantity,
        "unit_price": str(order.unit_price),
        "total_amount": str(order.amount),
        "status": order.order_status,
    }


def get_order_history(user: User, db: Session) -> list[Order]:
    return (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


def get_all_orders(db: Session, skip: int = 0, limit: int = 50) -> list[Order]:
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )