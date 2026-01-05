"""
User endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserProfile
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/me", response_model=dict)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile endpoint"""
    return {
        "success": True,
        "data": {
            "user": UserProfile.model_validate(current_user).model_dump(),
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
    
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(user).model_dump(),
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
    
    # TODO: Implement badge system in Phase 6
    # For now, return empty badges
    return {
        "success": True,
        "data": {
            "badges": [],
        },
        "errors": None,
    }


@router.get("/{user_id}/reputation-history", response_model=dict)
async def get_reputation_history(user_id: str, db: Session = Depends(get_db)):
    """Get reputation history endpoint"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    # TODO: Implement reputation history in Phase 6
    # For now, return empty history
    return {
        "success": True,
        "data": {
            "history": [],
        },
        "errors": None,
    }
