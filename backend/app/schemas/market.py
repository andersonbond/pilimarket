"""
Market schemas
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from uuid import uuid4


class OutcomeBase(BaseModel):
    """Base outcome schema"""
    name: str = Field(..., min_length=1, max_length=100)


class OutcomeCreate(OutcomeBase):
    """Schema for creating an outcome"""
    pass


class OutcomeResponse(OutcomeBase):
    """Schema for outcome response"""
    id: str
    market_id: str
    total_points: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class MarketBase(BaseModel):
    """Base market schema"""
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    rules: Optional[str] = Field(None, max_length=5000, description="Resolution rules/criteria")
    image_url: Optional[str] = Field(None, description="Market image URL")
    category: str = Field(..., pattern="^(election|politics|sports|entertainment|economy|weather|other)$")
    meta_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    max_points_per_user: int = Field(default=10000, ge=1, le=1000000)


class MarketCreate(MarketBase):
    """Schema for creating a market"""
    outcomes: List[OutcomeCreate] = Field(..., min_items=2, max_items=10)

    @field_validator('outcomes')
    @classmethod
    def validate_outcome_names(cls, v):
        """Ensure outcome names are unique"""
        names = [outcome.name for outcome in v]
        if len(names) != len(set(names)):
            raise ValueError("Outcome names must be unique")
        return v


class MarketUpdate(BaseModel):
    """Schema for updating a market"""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    rules: Optional[str] = Field(None, max_length=5000)
    image_url: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(election|politics|sports|entertainment|economy|weather|other)$")
    status: Optional[str] = Field(None, pattern="^(open|suspended|resolved|cancelled)$")
    meta_data: Optional[Dict[str, Any]] = None
    max_points_per_user: Optional[int] = Field(None, ge=1, le=1000000)


class MarketResponse(MarketBase):
    """Schema for market response"""
    id: str
    slug: str
    status: str
    resolution_outcome: Optional[str] = None
    resolution_time: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    outcomes: List[OutcomeResponse] = []

    class Config:
        from_attributes = True


class MarketDetailResponse(MarketResponse):
    """Schema for detailed market response with consensus"""
    consensus: Dict[str, float] = Field(default_factory=dict)  # e.g., {"Yes": 65.5, "No": 34.5}
    total_volume: int = 0

    class Config:
        from_attributes = True


class MarketListResponse(BaseModel):
    """Schema for market list response"""
    success: bool = True
    data: Dict[str, Any] = Field(default_factory=dict)
    message: Optional[str] = None

