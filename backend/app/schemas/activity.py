"""
Activity schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ActivityBase(BaseModel):
    """Base activity schema"""
    activity_type: str
    market_id: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ActivityCreate(ActivityBase):
    """Activity creation schema"""
    user_id: Optional[str] = None  # None for global/system activities


class ActivityResponse(ActivityBase):
    """Activity response schema"""
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActivityDetailResponse(ActivityResponse):
    """Detailed activity response with user and market names"""
    user_display_name: Optional[str] = None
    market_title: Optional[str] = None


class ActivityListResponse(BaseModel):
    """Schema for activity list response"""
    success: bool = True
    data: dict = Field(default_factory=dict)
    message: Optional[str] = None

