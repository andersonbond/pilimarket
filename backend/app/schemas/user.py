"""
User schemas
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
import re


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    display_name: str = Field(..., min_length=3, max_length=50)
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")
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
    
    @validator('contact_number')
    def validate_contact_number(cls, v):
        """Validate contact number: must start with +63 and have 10 digits after"""
        if not v:
            raise ValueError('Contact number is required')
        v = v.strip()
        # Check format: +63 followed by exactly 10 digits
        pattern = r'^\+63\d{10}$'
        if not re.match(pattern, v):
            raise ValueError('Contact number must be in format +63XXXXXXXXXX (e.g., +639123456789)')
        return v


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
    badges: List[str] = Field(default_factory=list)
    is_active: bool
    is_verified: bool
    is_admin: bool
    is_market_moderator: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    @validator('badges', pre=True)
    def validate_badges(cls, v):
        """Ensure badges is always a list"""
        if v is None:
            return []
        if isinstance(v, str):
            import json
            try:
                return json.loads(v) if v else []
            except:
                return []
        if isinstance(v, list):
            return v
        return []
    
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
    badges: List[str] = Field(default_factory=list)
    
    @validator('badges', pre=True)
    def validate_badges(cls, v):
        """Ensure badges is always a list"""
        if v is None:
            return []
        if isinstance(v, str):
            import json
            try:
                return json.loads(v) if v else []
            except:
                return []
        if isinstance(v, list):
            return v
        return []
    
    class Config:
        from_attributes = True

