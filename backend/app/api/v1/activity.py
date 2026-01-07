"""
Activity feed endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_optional
from app.models.user import User
from app.models.activity import Activity
from app.models.market import Market
from app.schemas.activity import ActivityResponse, ActivityDetailResponse, ActivityListResponse
from app.services.activity_service import (
    get_user_activity_feed,
    get_global_activity_feed,
)

router = APIRouter()


@router.get("/feed", response_model=dict)
async def get_activity_feed(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    type: Optional[str] = Query(None, description="Filter by activity type"),
    market_id: Optional[str] = Query(None, description="Filter by market ID"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get user's personalized activity feed (requires authentication)
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Results per page (default: 20, max: 100)
    - type: Filter by activity type (optional)
    - market_id: Filter by market ID (optional)
    
    Returns:
    - activities: List of activities
    - pagination: Pagination metadata
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for personalized feed",
        )
    
    activities, total = get_user_activity_feed(
        db, current_user.id, page, limit, type, market_id
    )
    
    # Enrich with user and market names
    enriched_activities = []
    for activity in activities:
        activity_dict = ActivityResponse.model_validate(activity).model_dump()
        
        # Add user display name if available
        if activity.user_id:
            user = db.query(User).filter(User.id == activity.user_id).first()
            if user:
                activity_dict["user_display_name"] = user.display_name
        
        # Add market title if available
        if activity.market_id:
            market = db.query(Market).filter(Market.id == activity.market_id).first()
            if market:
                activity_dict["market_title"] = market.title
        
        enriched_activities.append(activity_dict)
    
    # Calculate pagination
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "activities": enriched_activities,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }


@router.get("/global", response_model=dict)
async def get_global_activity(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    type: Optional[str] = Query(None, description="Filter by activity type"),
    category: Optional[str] = Query(None, description="Filter by market category"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get global activity feed (public endpoint)
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Results per page (default: 50, max: 100)
    - type: Filter by activity type (optional)
    - category: Filter by market category (optional)
    
    Returns:
    - activities: List of activities
    - pagination: Pagination metadata
    """
    activities, total = get_global_activity_feed(db, page, limit, type, category)
    
    # Enrich with user and market names
    enriched_activities = []
    for activity in activities:
        activity_dict = ActivityResponse.model_validate(activity).model_dump()
        
        # Add user display name if available
        if activity.user_id:
            user = db.query(User).filter(User.id == activity.user_id).first()
            if user:
                activity_dict["user_display_name"] = user.display_name
        
        # Add market title if available
        if activity.market_id:
            market = db.query(Market).filter(Market.id == activity.market_id).first()
            if market:
                activity_dict["market_title"] = market.title
        
        enriched_activities.append(activity_dict)
    
    # Calculate pagination
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "activities": enriched_activities,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }

