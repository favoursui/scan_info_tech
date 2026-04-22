"""
app/routes/products.py
Public product listing and detail endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.product import ProductOut
from app.services.product_service import get_products, get_product

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return a paginated list of all products."""
    return get_products(db, skip=skip, limit=limit)


@router.get("/{product_id}", response_model=ProductOut)
def product_detail(product_id: int, db: Session = Depends(get_db)):
    """Return a single product by ID."""
    return get_product(product_id, db)
