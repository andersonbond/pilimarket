"""
Notification schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationBase(BaseModel):
    """Base notification schema"""
    type: str
    message: str
    meta_data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class NotificationCreate(NotificationBase):
    """Notification creation schema"""
    user_id: str


class NotificationResponse(NotificationBase):
    """Notification response schema"""
    id: str
    user_id: str
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Schema for notification list response"""
    success: bool = True
    data: dict = Field(default_factory=dict)
    message: Optional[str] = None

