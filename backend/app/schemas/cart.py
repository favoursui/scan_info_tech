from decimal import Decimal
from pydantic import BaseModel, Field
from app.schemas.product import ProductOut


class CartAdd(BaseModel):
    product_id: int
    quantity: int = Field(1, ge=1)
    user_id: int | None = None


class CartUpdateQty(BaseModel):
    cart_id: int
    quantity: int = Field(..., ge=0)


class CartItemOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int | None
    quantity: int
    product: ProductOut