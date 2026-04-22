"""app/schemas/order.py"""
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from app.models.order import OrderStatus


class CheckoutRequest(BaseModel):
    """Checkout a single cart item (extend for multi-item if needed)."""
    cart_id: int


class OrderOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    product_id: int
    user_id: int
    amount: Decimal
    quantity: int
    unit_price: Decimal
    order_status: OrderStatus
    created_at: datetime
    updated_at: datetime
