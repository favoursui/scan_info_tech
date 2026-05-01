from datetime import datetime
from decimal import Decimal
from typing import Annotated
from pydantic import BaseModel, Field

# Reusable annotated type: positive decimal, max 2 decimal places
PositiveDecimal = Annotated[Decimal, Field(gt=0)]


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    price: PositiveDecimal
    stock_quantity: int = Field(..., ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None
    price: PositiveDecimal | None = None
    stock_quantity: int | None = Field(None, ge=0)


class ProductOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    price: Decimal
    stock_quantity: int
    image_url: str | None
    created_at: datetime
    updated_at: datetime
