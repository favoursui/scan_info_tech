"""
app/routes/cart.py
Cart endpoints.
"""
from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.cart import CartAdd, CartUpdateQty, CartItemOut
from app.services.cart_service import add_to_cart, update_cart_quantity
from app.models.cart import Cart
from app.models.user import User

# Optional bearer — doesn't fail if token is absent
_optional_bearer = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/cart", tags=["Cart"])


def _optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Return the current user if a valid token is provided, else None."""
    if not credentials:
        return None
    try:
        from app.core.security import decode_access_token
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.get(User, user_id)
    except Exception:
        return None


@router.post("/add", status_code=201)
def add_item(
    payload: CartAdd,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(_optional_user),
):
    """
    Add a product to the cart.
    If logged in, cart is tied to your account automatically.
    Guest users can pass user_id=null.
    """
    # Always use the authenticated user's id if logged in
    if current_user:
        payload.user_id = current_user.id

    cart = add_to_cart(payload, db)
    return {
        "detail": "Item added to cart",
        "cart_id": cart.id,
        "product_id": cart.product_id,
        "quantity": cart.quantity,
        "user_id": cart.user_id,
    }


@router.get("/my-cart", response_model=list[CartItemOut])
def get_my_cart(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(_optional_user),
):
    """Get all items in the current user's cart."""
    if not current_user:
        return []
    return (
        db.query(Cart)
        .filter(Cart.user_id == current_user.id)
        .all()
    )


@router.patch("/update-qty")
def update_qty(
    payload: CartUpdateQty,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(_optional_user),
):
    """
    Update cart item quantity.
    Setting quantity to 0 removes the item entirely.
    """
    user_id = current_user.id if current_user else None
    return update_cart_quantity(payload, user_id=user_id, db=db)


@router.delete("/clear")
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(_optional_user),
):
    """Remove all items from the current user's cart."""
    if not current_user:
        return {"detail": "No cart to clear"}
    db.query(Cart).filter(Cart.user_id == current_user.id).delete()
    db.commit()
    return {"detail": "Cart cleared"}