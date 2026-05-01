"""
Admin-only inventory management with Cloudinary image handling.
"""
from decimal import Decimal, InvalidOperation
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.services.product_service import create_product, update_product, delete_product

router = APIRouter(prefix="/inventory", tags=["Inventory (Admin)"])


def _parse_decimal(value: str | None, field: str) -> Decimal | None:
    if value is None:
        return None
    try:
        d = Decimal(value)
        if d <= 0:
            raise HTTPException(status_code=422, detail=f"{field} must be greater than 0")
        return d
    except InvalidOperation:
        raise HTTPException(status_code=422, detail=f"{field} must be a valid number")


@router.post("/product", response_model=ProductOut, status_code=201)
def add_product(
    name: str = Form(..., min_length=2, max_length=255),
    description: str | None = Form(None),
    price: str = Form(...),
    stock_quantity: int = Form(..., ge=0),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Create a new product.
    Optionally attach an image — it is uploaded to Cloudinary and the
    secure_url is stored in the database.
    """
    parsed_price = _parse_decimal(price, "price")
    payload = ProductCreate(
        name=name,
        description=description,
        price=parsed_price,
        stock_quantity=stock_quantity,
    )
    return create_product(payload, image, db)


@router.put("/product/{product_id}", response_model=ProductOut)
def edit_product(
    product_id: int,
    name: str | None = Form(None),
    description: str | None = Form(None),
    price: str | None = Form(None),
    stock_quantity: int | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Update an existing product.
    Uploading a new image replaces the previous Cloudinary asset.
    Only fields provided are updated (partial update).
    """
    parsed_price = _parse_decimal(price, "price") if price is not None else None
    payload = ProductUpdate(
        name=name,
        description=description,
        price=parsed_price,
        stock_quantity=stock_quantity,
    )
    return update_product(product_id, payload, image, db)


@router.delete("/product/{product_id}")
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Permanently delete a product.
    The associated Cloudinary image is also deleted.
    """
    return delete_product(product_id, db)
