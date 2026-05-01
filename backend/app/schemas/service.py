from datetime import datetime
from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)


class ServiceUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)


class ServiceOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    created_at: datetime
    updated_at: datetime