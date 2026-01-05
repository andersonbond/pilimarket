"""
Authentication endpoints
"""
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.user import UserResponse
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_reset_token,
)

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """User registration endpoint"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Email already registered"}],
        }
    
    # Check if display name is taken
    existing_display_name = db.query(User).filter(User.display_name == request.display_name).first()
    if existing_display_name:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Display name already taken"}],
        }
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(request.password)
    
    new_user = User(
        id=user_id,
        email=request.email,
        display_name=request.display_name,
        hashed_password=hashed_password,
        chips=1000,  # Starting chips
        reputation=50.0,  # Starting reputation
        rank_score=0.0,
        is_active=True,
        is_verified=False,
        is_admin=False,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate tokens
    token_data = {"sub": user_id, "email": request.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(new_user).model_dump(),
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        },
        "errors": None,
    }


@router.post("/login", response_model=dict)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """User login endpoint"""
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid email or password"}],
        }
    
    if not user.is_active:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User account is inactive"}],
        }
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    token_data = {"sub": user.id, "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(user).model_dump(),
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        },
        "errors": None,
    }


@router.post("/refresh", response_model=dict)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh token endpoint"""
    payload = decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid refresh token"}],
        }
    
    user_id = payload.get("sub")
    if not user_id:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid token payload"}],
        }
    
    # Verify user exists and is active
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found or inactive"}],
        }
    
    # Generate new access token
    token_data = {"sub": user.id, "email": user.email}
    access_token = create_access_token(token_data)
    
    return {
        "success": True,
        "data": {
            "access_token": access_token,
        },
        "errors": None,
    }


@router.post("/forgot-password", response_model=dict)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Forgot password endpoint"""
    user = db.query(User).filter(User.email == request.email).first()
    
    # Don't reveal if email exists (security best practice)
    if not user:
        return {
            "success": True,
            "data": {"message": "If the email exists, a password reset link has been sent"},
            "errors": None,
        }
    
    # Generate reset token
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    db.commit()
    
    # TODO: Send email with reset link
    # For now, we'll just return success
    # In production, send email with link: /reset-password?token={reset_token}
    
    return {
        "success": True,
        "data": {
            "message": "If the email exists, a password reset link has been sent",
            # In development, include token for testing (remove in production)
            "reset_token": reset_token if db.query(User).count() < 10 else None,
        },
        "errors": None,
    }


@router.post("/reset-password", response_model=dict)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password endpoint"""
    # Find user by reset token
    user = db.query(User).filter(
        User.reset_token == request.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid or expired reset token"}],
        }
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Password reset successfully"},
        "errors": None,
    }
