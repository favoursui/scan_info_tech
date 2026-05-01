"""
CRUD operations for products including Cloudinary image management.
"""
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.cloudinary import upload_image, replace_image, delete_image


#  Public 

def get_products(db: Session, skip: int = 0, limit: int = 20) -> list[Product]:
    return db.query(Product).offset(skip).limit(limit).all()


def get_product(product_id: int, db: Session) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


#  Admin: inventory management 

def create_product(payload: ProductCreate, image: UploadFile | None, db: Session) -> Product:
    image_url: str | None = None
    cloudinary_public_id: str | None = None

    if image:
        result = upload_image(image.file)
        image_url = result["secure_url"]
        cloudinary_public_id = result["public_id"]

    product = Product(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        stock_quantity=payload.stock_quantity,
        image_url=image_url,
        cloudinary_public_id=cloudinary_public_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    product_id: int,
    payload: ProductUpdate,
    image: UploadFile | None,
    db: Session,
) -> Product:
    product = get_product(product_id, db)

    if image:
        if product.cloudinary_public_id:
            result = replace_image(image.file, product.cloudinary_public_id)
        else:
            result = upload_image(image.file)
        product.image_url = result["secure_url"]
        product.cloudinary_public_id = result["public_id"]

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(product_id: int, db: Session) -> dict:
    product = get_product(product_id, db)

    if product.cloudinary_public_id:
        delete_image(product.cloudinary_public_id)

    db.delete(product)
    db.commit()
    return {"detail": f"Product {product_id} deleted"}
