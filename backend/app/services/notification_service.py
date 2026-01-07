"""
Notification service
"""
import uuid
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.models.notification import Notification
from app.models.user import User
from app.utils.cache import get_cache, set_cache, delete_cache


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    message: str,
    metadata: Optional[Dict] = None
) -> Notification:
    """
    Create a single notification
    
    Returns:
        Created Notification object
    """
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=notification_type,
        message=message,
        read=False,
        meta_data=metadata or {}
    )
    db.add(notification)
    
    # Invalidate cache
    delete_cache(f"notifications:unread_count:{user_id}")
    delete_cache(f"notifications:recent:{user_id}")
    
    return notification


def create_notifications_batch(
    db: Session,
    user_ids: List[str],
    notification_type: str,
    message: str,
    metadata: Optional[Dict] = None
) -> List[Notification]:
    """
    Create notifications for multiple users in batch (optimized)
    
    Returns:
        List of created Notification objects
    """
    notifications = [
        Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=notification_type,
            message=message,
            read=False,
            meta_data=metadata or {}
        )
        for user_id in user_ids
    ]
    
    db.bulk_insert_mappings(Notification, [
        {
            "id": n.id,
            "user_id": n.user_id,
            "type": n.type,
            "message": n.message,
            "read": n.read,
            "meta_data": n.meta_data,
            "created_at": func.now()
        }
        for n in notifications
    ])
    
    # Invalidate cache for all affected users
    for user_id in user_ids:
        delete_cache(f"notifications:unread_count:{user_id}")
        delete_cache(f"notifications:recent:{user_id}")
    
    return notifications


def get_unread_count(db: Session, user_id: str, use_cache: bool = True) -> int:
    """
    Get unread notification count for a user (cached)
    
    Args:
        db: Database session
        user_id: User ID
        use_cache: Whether to use cache (default: True)
    
    Returns:
        Unread count
    """
    cache_key = f"notifications:unread_count:{user_id}"
    
    # Try cache first
    if use_cache:
        cached = get_cache(cache_key)
        if cached is not None:
            return cached
    
    # Query database
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False
    ).count()
    
    # Cache result (30 second TTL)
    if use_cache:
        set_cache(cache_key, count, ttl=30)
    
    return count


def get_notifications(
    db: Session,
    user_id: str,
    unread_only: bool = False,
    page: int = 1,
    limit: int = 20,
    notification_type: Optional[str] = None
) -> tuple[List[Notification], int]:
    """
    Get notifications for a user with pagination
    
    Returns:
        Tuple of (notifications list, total count)
    """
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if unread_only:
        query = query.filter(Notification.read == False)
    
    if notification_type:
        query = query.filter(Notification.type == notification_type)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()
    
    return notifications, total


def mark_as_read(db: Session, notification_id: str, user_id: str) -> bool:
    """
    Mark a notification as read
    
    Returns:
        True if successful, False if not found
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if not notification:
        return False
    
    notification.read = True
    
    # Invalidate cache
    delete_cache(f"notifications:unread_count:{user_id}")
    delete_cache(f"notifications:recent:{user_id}")
    
    return True


def mark_all_as_read(db: Session, user_id: str) -> int:
    """
    Mark all notifications as read for a user
    
    Returns:
        Number of notifications marked as read
    """
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False
    ).update({"read": True}, synchronize_session=False)
    
    # Invalidate cache
    delete_cache(f"notifications:unread_count:{user_id}")
    delete_cache(f"notifications:recent:{user_id}")
    
    return count

