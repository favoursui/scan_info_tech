"""app/schemas/order.py"""
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    cart_id: int


class OrderOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    product_id: int
    user_id: int
    amount: Decimal
    quantity: int
    unit_price: Decimal
    order_status: str
    created_at: datetime
    updated_at: datetime