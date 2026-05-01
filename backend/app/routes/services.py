"""
Public read + Admin CRUD for services + booking endpoint.
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut
from app.utils.email import send_booking_email
from app.config import get_settings

router = APIRouter(prefix="/services", tags=["Services"])
settings = get_settings()


class BookingRequest(BaseModel):
    service_name: str
    client_name: str
    client_email: EmailStr
    client_phone: str | None = None
    message: str | None = None


@router.get("", response_model=list[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return db.query(Service).order_by(Service.created_at.desc()).all()


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


@router.post("", response_model=ServiceOut, status_code=201)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    existing = db.query(Service).filter(Service.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A service with this name already exists",
        )
    service = Service(name=payload.name)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    service.name = payload.name
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"detail": f"Service '{service.name}' deleted"}


@router.post("/book")
async def book_service(payload: BookingRequest):
    """Public — submit a service booking. Sends email to admin."""
    asyncio.ensure_future(
        send_booking_email(
            service_name=payload.service_name,
            client_name=payload.client_name,
            client_email=payload.client_email,
            client_phone=payload.client_phone or "",
            message=payload.message or "",
            admin_email=settings.mail_from,
        )
    )
    return {"detail": "Booking submitted successfully. We'll be in touch soon!"}