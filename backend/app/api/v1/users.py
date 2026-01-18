"""
User endpoints
"""
import uuid as uuid_module
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from starlette.requests import Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserProfile
from app.dependencies import get_current_user

router = APIRouter()

# Create uploads directory for user avatars if it doesn't exist
UPLOAD_DIR = "uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed image MIME types (common mobile formats)
ALLOWED_IMAGE_TYPES = [
    "image/jpeg", 
    "image/jpg", 
    "image/png", 
    "image/gif", 
    "image/webp",
    "image/heic",  # iPhone format
    "image/heif",  # iPhone format
]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.get("/me", response_model=dict)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile endpoint"""
    # Get forecast stats
    from app.services.reputation_service import get_user_forecast_stats
    stats = get_user_forecast_stats(db, current_user.id)
    
    return {
        "success": True,
        "data": {
            "user": UserProfile.model_validate(current_user).model_dump(),
            "stats": stats,
        },
        "errors": None,
    }


@router.patch("/me", response_model=dict)
async def update_profile(
    request: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update own profile endpoint"""
    # Check if display name is being changed and if it's taken
    if request.display_name and request.display_name != current_user.display_name:
        existing_user = db.query(User).filter(
            User.display_name == request.display_name,
            User.id != current_user.id
        ).first()
        if existing_user:
            return {
                "success": False,
                "data": None,
                "errors": [{"message": "Display name already taken"}],
            }
        current_user.display_name = request.display_name
    
    # Update bio if provided
    if request.bio is not None:
        current_user.bio = request.bio
    
    # Update avatar_url if provided
    if request.avatar_url is not None:
        current_user.avatar_url = request.avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "success": True,
        "data": {
            "user": UserProfile.model_validate(current_user).model_dump(),
        },
        "errors": None,
    }


@router.get("/{user_id}/profile", response_model=dict)
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Get user profile endpoint (public)"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    # Get forecast stats
    from app.services.reputation_service import get_user_forecast_stats
    stats = get_user_forecast_stats(db, user_id)
    
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(user).model_dump(),
            "stats": stats,
        },
        "errors": None,
    }


@router.get("/{user_id}/badges", response_model=dict)
async def get_user_badges(user_id: str, db: Session = Depends(get_db)):
    """Get user badges endpoint"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    from app.services.badge_service import get_user_badges as get_badges
    badges = get_badges(user)
    
    return {
        "success": True,
        "data": {
            "badges": badges,
        },
        "errors": None,
    }


@router.post("/{user_id}/badges/check", response_model=dict)
async def check_user_badges(user_id: str, db: Session = Depends(get_db)):
    """Manually check and award badges for a user (useful for retroactive badge awarding)"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    from app.services.badge_service import check_and_award_badges, get_user_badges as get_badges
    from app.models.forecast import Forecast
    
    # Get current forecast count for info
    forecast_count = db.query(Forecast).filter(Forecast.user_id == user_id).count()
    
    # Check and award badges
    newly_awarded = check_and_award_badges(db, user_id)
    
    # Refresh user to get updated badges
    db.refresh(user)
    
    # Get formatted badges
    badges = get_badges(user)
    
    return {
        "success": True,
        "data": {
            "forecast_count": forecast_count,
            "newly_awarded": newly_awarded,
            "badges": badges,
        },
        "errors": None,
    }


@router.post("/me/upload-avatar", response_model=dict)
async def upload_profile_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload profile avatar image"""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, HEIC, HEIF",
        )
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 10MB limit. Current size: {file_size / 1024 / 1024:.2f}MB",
        )
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    # Normalize extension for HEIC/HEIF
    if file.content_type in ["image/heic", "image/heif"]:
        file_ext = ".heic"
    unique_filename = f"{uuid_module.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Return full URL (in production, this would be a CDN URL)
    # For development, construct URL from request
    base_url = str(request.base_url).rstrip('/')
    image_url = f"{base_url}/uploads/avatars/{unique_filename}"
    
    # Update user's avatar_url
    current_user.avatar_url = image_url
    db.commit()
    db.refresh(current_user)
    
    return {
        "success": True,
        "data": {
            "avatar_url": image_url,
            "filename": unique_filename,
        },
        "message": "Avatar uploaded successfully",
    }


@router.get("/{user_id}/reputation-history", response_model=dict)
async def get_reputation_history(
    user_id: str,
    db: Session = Depends(get_db),
    limit: int = 100
):
    """Get reputation history endpoint"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    from app.models.reputation_history import ReputationHistory
    from sqlalchemy import desc
    
    history = db.query(ReputationHistory).filter(
        ReputationHistory.user_id == user_id
    ).order_by(desc(ReputationHistory.created_at)).limit(limit).all()
    
    history_data = [
        {
            "reputation": h.reputation,
            "accuracy_score": h.accuracy_score,
            "total_forecast_points": h.total_forecast_points,
            "created_at": h.created_at.isoformat(),
        }
        for h in history
    ]
    
    return {
        "success": True,
        "data": {
            "history": history_data,
        },
        "errors": None,
    }
