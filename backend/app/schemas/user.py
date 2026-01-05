"""
User schemas
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    display_name: str = Field(..., min_length=3, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('display_name')
    def validate_display_name(cls, v):
        """Validate display name"""
        if not v.strip():
            raise ValueError('Display name cannot be empty')
        if len(v.strip()) < 3:
            raise ValueError('Display name must be at least 3 characters')
        return v.strip()


class UserUpdate(BaseModel):
    """User update schema"""
    display_name: Optional[str] = Field(None, min_length=3, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    
    @validator('display_name')
    def validate_display_name(cls, v):
        """Validate display name"""
        if v is not None and not v.strip():
            raise ValueError('Display name cannot be empty')
        if v is not None and len(v.strip()) < 3:
            raise ValueError('Display name must be at least 3 characters')
        return v.strip() if v else None


class UserResponse(UserBase):
    """User response schema"""
    id: str
    chips: int
    reputation: float
    rank_score: float
    badges: List[str] = []
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    """Extended user profile schema"""
    pass


class UserPublic(BaseModel):
    """Public user schema (for leaderboards, etc.)"""
    id: str
    display_name: str
    reputation: float
    rank_score: float
    badges: List[str] = []  # Placeholder for Phase 6 badge system
    
    class Config:
        from_attributes = True

