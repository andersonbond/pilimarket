"""
Activity service
"""
import uuid
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.models.activity import Activity
from app.models.user import User
from app.models.market import Market
from app.utils.cache import get_cache, set_cache, delete_cache_pattern


def create_activity(
    db: Session,
    activity_type: str,
    user_id: Optional[str] = None,
    market_id: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> Activity:
    """
    Create an activity record
    
    Args:
        db: Database session
        activity_type: Type of activity (forecast_placed, market_resolved, etc.)
        user_id: User ID (None for system/global activities)
        market_id: Market ID (if applicable)
        metadata: Additional data (JSON)
    
    Returns:
        Created Activity object
    """
    activity = Activity(
        id=str(uuid.uuid4()),
        user_id=user_id,
        activity_type=activity_type,
        market_id=market_id,
        meta_data=metadata or {}
    )
    db.add(activity)
    
    # Invalidate global activity cache
    delete_cache_pattern("activity:global:*")
    if user_id:
        delete_cache_pattern(f"activity:feed:{user_id}:*")
    
    return activity


def get_user_activity_feed(
    db: Session,
    user_id: str,
    page: int = 1,
    limit: int = 20,
    activity_type: Optional[str] = None,
    market_id: Optional[str] = None,
    use_cache: bool = True
) -> tuple[List[Activity], int]:
    """
    Get user's personalized activity feed
    
    Returns:
        Tuple of (activities list, total count)
    """
    # Note: Caching disabled for MVP - Activity objects need proper serialization
    # Can be added as optimization later
    cache_key = f"activity:feed:{user_id}:{page}:{limit}"
    
    # Query activities related to user (their activities + markets they follow)
    # For MVP: show user's own activities + global activities
    query = db.query(Activity).filter(
        (Activity.user_id == user_id) | (Activity.user_id.is_(None))
    )
    
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    
    if market_id:
        query = query.filter(Activity.market_id == market_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    activities = query.order_by(desc(Activity.created_at)).offset(offset).limit(limit).all()
    
    # Note: Caching disabled for MVP - can be added as optimization later
    return activities, total


def get_global_activity_feed(
    db: Session,
    page: int = 1,
    limit: int = 50,
    activity_type: Optional[str] = None,
    category: Optional[str] = None,
    use_cache: bool = True
) -> tuple[List[Activity], int]:
    """
    Get global activity feed (public)
    
    Returns:
        Tuple of (activities list, total count)
    """
    # Note: Caching disabled for MVP - Activity objects need proper serialization
    # Can be added as optimization later
    cache_key = f"activity:global:{page}:{limit}:{activity_type or 'all'}:{category or 'all'}"
    
    # Query global activities (user_id IS NULL) or all activities
    query = db.query(Activity)
    
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    
    # If category filter, join with markets
    if category:
        query = query.join(Market).filter(Market.category == category)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    activities = query.order_by(desc(Activity.created_at)).offset(offset).limit(limit).all()
    
    # Note: Caching disabled for MVP - can be added as optimization later
    return activities, total

