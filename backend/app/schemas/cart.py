"""app/schemas/cart.py"""
from decimal import Decimal
from pydantic import BaseModel, Field
from app.schemas.product import ProductOut


class CartAdd(BaseModel):
    product_id: int
    quantity: int = Field(1, ge=1)
    user_id: int | None = None      # None → guest cart


class CartUpdateQty(BaseModel):
    cart_id: int
    quantity: int = Field(..., ge=0)  # 0 removes the item


class CartItemOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    quantity: int
    product: ProductOut

    @property
    def subtotal(self) -> Decimal:
        return self.product.price * self.quantity
