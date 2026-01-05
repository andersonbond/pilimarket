"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    display_name: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

