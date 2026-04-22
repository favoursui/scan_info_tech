"""app/schemas/account.py"""
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class AccountOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    balance: Decimal
    created_at: datetime
    updated_at: datetime
