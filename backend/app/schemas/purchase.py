"""
Purchase schemas
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class PurchaseBase(BaseModel):
    """Base purchase schema"""
    chips_added: int = Field(..., ge=1, le=100000, description="Number of chips to purchase (1 chip = ₱1.00)")


class PurchaseCreate(PurchaseBase):
    """Purchase creation schema (for test mode - bypasses payment)"""
    pass


class PurchaseResponse(BaseModel):
    """Purchase response schema"""
    id: str
    user_id: str
    amount_cents: int
    chips_added: int
    provider: str
    provider_tx_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PurchaseListResponse(BaseModel):
    """Purchase list response schema"""
    purchases: list[PurchaseResponse]
    total_count: int
    page: int
    limit: int
    total_pages: int

