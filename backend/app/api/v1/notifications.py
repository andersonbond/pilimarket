"""
Notification endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services.notification_service import (
    get_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
)

router = APIRouter()


@router.get("", response_model=dict)
async def get_user_notifications(
    unread_only: bool = Query(False, description="Filter to unread notifications only"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    type: Optional[str] = Query(None, description="Filter by notification type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user's notifications with pagination
    
    Query Parameters:
    - unread_only: Filter to unread notifications (default: false)
    - page: Page number (default: 1)
    - limit: Results per page (default: 20, max: 100)
    - type: Filter by notification type (optional)
    
    Returns:
    - notifications: List of notifications
    - unread_count: Total unread count (always included)
    - pagination: Pagination metadata
    """
    notifications, total = get_notifications(
        db, current_user.id, unread_only, page, limit, type
    )
    
    # Get unread count (always include for badge)
    unread_count = get_unread_count(db, current_user.id)
    
    # Calculate pagination
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "notifications": [NotificationResponse.model_validate(n).model_dump() for n in notifications],
            "unread_count": unread_count,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }


@router.get("/unread-count", response_model=dict)
async def get_unread_count_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get unread notification count only (lightweight endpoint for header badge)
    
    Returns:
    - unread_count: Number of unread notifications
    """
    count = get_unread_count(db, current_user.id)
    
    return {
        "success": True,
        "data": {
            "unread_count": count,
        },
        "errors": None,
    }


@router.post("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a notification as read
    
    Returns:
    - success: Boolean indicating success
    """
    success = mark_as_read(db, notification_id, current_user.id)
    
    if not success:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Notification not found"}],
        }
    
    db.commit()
    
    # Get updated unread count
    unread_count = get_unread_count(db, current_user.id)
    
    return {
        "success": True,
        "data": {
            "unread_count": unread_count,
        },
        "errors": None,
    }


@router.post("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all notifications as read for the current user (bulk operation)
    
    Returns:
    - count: Number of notifications marked as read
    - unread_count: Updated unread count (should be 0)
    """
    count = mark_all_as_read(db, current_user.id)
    db.commit()
    
    # Get updated unread count
    unread_count = get_unread_count(db, current_user.id)
    
    return {
        "success": True,
        "data": {
            "count": count,
            "unread_count": unread_count,
        },
        "errors": None,
    }

