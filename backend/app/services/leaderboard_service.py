"""
Leaderboard calculation service
"""
import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.models.user import User
from app.models.forecast import Forecast
from app.models.market import Market
from app.services.streak_service import calculate_winning_streak, calculate_activity_streak
from app.services.reputation_service import get_user_forecast_stats
from app.utils.cache import get_cache, set_cache, delete_cache_pattern


def calculate_rank_score(
    reputation: float,
    winning_streak: int,
    activity_streak: int,
    total_forecasts: int
) -> float:
    """
    Calculate leaderboard rank score
    
    Formula:
    rank_score = (0.5 * reputation) + (0.25 * streak_bonus) + (0.25 * activity_bonus)
    
    - reputation: 0-100 (already calculated)
    - streak_bonus: normalized from winning_streak (max 50 points for 10+ streak)
    - activity_bonus: normalized from activity_streak and total_forecasts (max 50 points)
    
    Returns:
        Rank score (0-1000 scale)
    """
    # Reputation component (0-50 points)
    reputation_component = (reputation / 100.0) * 50.0
    
    # Streak bonus (0-25 points)
    # Winning streak: 0-10+ mapped to 0-25 points
    streak_bonus = min(25.0, (winning_streak / 10.0) * 25.0)
    
    # Activity bonus (0-25 points)
    # Combination of activity streak and total forecasts
    # Activity streak: 0-30 days mapped to 0-15 points
    activity_streak_bonus = min(15.0, (activity_streak / 30.0) * 15.0)
    # Total forecasts: log scale, max 10 points
    forecast_bonus = min(10.0, math.log(1 + total_forecasts) / math.log(100) * 10.0)
    activity_component = activity_streak_bonus + forecast_bonus
    
    # Total rank score (0-100 scale, then multiply by 10 for 0-1000)
    rank_score = (reputation_component + streak_bonus + activity_component) * 10.0
    
    return round(rank_score, 2)


def calculate_leaderboard(
    db: Session,
    period: str = "global",
    category: Optional[str] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Calculate leaderboard for a given period and category
    
    Args:
        db: Database session
        period: "global", "weekly", or "monthly"
        category: Market category filter (None for all)
        limit: Maximum number of users to return
    
    Returns:
        List of user dictionaries with rank, display_name, reputation, rank_score, badges
    """
    # Get date filter based on period (make timezone-aware)
    date_filter = None
    if period == "weekly":
        date_filter = datetime.now(timezone.utc) - timedelta(days=7)
    elif period == "monthly":
        date_filter = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Get all active users
    query = db.query(User).filter(User.is_active == True)
    
    # If period filter, only include users with forecasts in that period
    if date_filter:
        # Get user IDs with forecasts in the period
        user_ids_with_activity = db.query(Forecast.user_id).filter(
            Forecast.created_at >= date_filter
        ).distinct().all()
        
        if user_ids_with_activity:
            user_ids = [uid[0] for uid in user_ids_with_activity]
            query = query.filter(User.id.in_(user_ids))
        else:
            # No activity in period, return empty
            return []
    
    # If category filter, only include users with forecasts in that category
    if category and category != "all":
        # Get user IDs with forecasts in this category
        category_markets = db.query(Market).filter(Market.category == category).all()
        if category_markets:
            market_ids = [m.id for m in category_markets]
            user_ids_with_category = db.query(Forecast.user_id).filter(
                Forecast.market_id.in_(market_ids)
            ).distinct().all()
            
            if user_ids_with_category:
                user_ids = [uid[0] for uid in user_ids_with_category]
                query = query.filter(User.id.in_(user_ids))
            else:
                return []
        else:
            return []
    
    # Get all users and calculate their rank scores
    users = query.all()
    leaderboard = []
    
    for user in users:
        # Calculate streaks
        winning_streak = calculate_winning_streak(db, user.id)
        activity_streak = calculate_activity_streak(db, user.id)
        
        # Get forecast stats
        stats = get_user_forecast_stats(db, user.id)
        
        # Calculate profit/loss and volume
        # Get all forecasts for this user
        user_forecasts = db.query(Forecast).filter(Forecast.user_id == user.id).all()
        
        # Apply period filter if needed
        if date_filter:
            user_forecasts = [f for f in user_forecasts if f.created_at >= date_filter]
        
        # Apply category filter if needed
        if category and category != "all":
            category_market_ids = [m.id for m in db.query(Market).filter(Market.category == category).all()]
            user_forecasts = [f for f in user_forecasts if f.market_id in category_market_ids]
        
        # Calculate volume (total points allocated)
        volume = sum(f.points for f in user_forecasts)
        
        # Calculate profit/loss
        # For won forecasts: calculate estimated profit (simplified - actual profit depends on market odds at resolution)
        # For lost forecasts: loss is the points allocated
        won_forecasts = [f for f in user_forecasts if f.status == 'won']
        lost_forecasts = [f for f in user_forecasts if f.status == 'lost']
        
        # Calculate profit from won forecasts (simplified: assume average 1.5x return)
        # In production, this should be calculated from actual market resolution data
        won_points = sum(f.points for f in won_forecasts) if won_forecasts else 0
        lost_points = sum(f.points for f in lost_forecasts) if lost_forecasts else 0
        
        # Simplified profit calculation: won forecasts get 1.5x return on average
        # This is a placeholder - actual profit should be calculated from resolution data
        # Profit = (won_points * 1.5) - lost_points
        # This means winners get their bet back (won_points) + 0.5x bonus, losers lose their bet
        profit_loss = int((won_points * 1.5) - lost_points) if won_points > 0 else -lost_points
        
        # Calculate rank score
        rank_score = calculate_rank_score(
            user.reputation,
            winning_streak,
            activity_streak,
            stats["total_forecasts"]
        )
        
        # Update user's rank_score
        user.rank_score = rank_score
        
        # Get badges
        badges = user.badges if user.badges else []
        if not isinstance(badges, list):
            badges = []
        
        leaderboard.append({
            "user_id": user.id,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "reputation": round(user.reputation, 2),
            "rank_score": rank_score,
            "winning_streak": winning_streak,
            "activity_streak": activity_streak,
            "total_forecasts": stats["total_forecasts"],
            "badges": badges,
            "profit_loss": profit_loss,
            "volume": volume,
        })
    
    # Sort by rank_score (descending)
    leaderboard.sort(key=lambda x: x["rank_score"], reverse=True)
    
    # Add ranks
    for i, entry in enumerate(leaderboard, start=1):
        entry["rank"] = i
    
    # Commit rank_score updates
    db.commit()
    
    # Return top N
    return leaderboard[:limit]


def get_cached_leaderboard(
    db: Session,
    period: str = "global",
    category: Optional[str] = None,
    limit: int = 100,
    cache_ttl: int = 300  # 5 minutes
) -> List[Dict]:
    """
    Get leaderboard from cache or calculate and cache it
    
    Args:
        db: Database session
        period: "global", "weekly", or "monthly"
        category: Market category filter (None for all)
        limit: Maximum number of users to return
        cache_ttl: Cache TTL in seconds
    
    Returns:
        List of user dictionaries with rank information
    """
    # Generate cache key
    category_key = category if category and category != "all" else "all"
    cache_key = f"leaderboard:{period}:{category_key}:{limit}"
    
    # Try to get from cache
    cached = get_cache(cache_key)
    if cached:
        return cached
    
    # Calculate leaderboard
    leaderboard = calculate_leaderboard(db, period, category, limit)
    
    # Cache it
    set_cache(cache_key, leaderboard, cache_ttl)
    
    return leaderboard


def get_user_rank(
    db: Session,
    user_id: str,
    period: str = "global",
    category: Optional[str] = None
) -> Optional[Dict]:
    """
    Get user's rank in the leaderboard
    
    Returns:
        Dictionary with rank information or None if user not found
    """
    # Get full leaderboard
    leaderboard = get_cached_leaderboard(db, period, category, limit=1000)
    
    # Find user
    for entry in leaderboard:
        if entry["user_id"] == user_id:
            return entry
    
    return None


def invalidate_leaderboard_cache(period: Optional[str] = None, category: Optional[str] = None):
    """
    Invalidate leaderboard cache
    
    Args:
        period: Specific period to invalidate (None for all)
        category: Specific category to invalidate (None for all)
    """
    if period and category:
        pattern = f"leaderboard:{period}:{category}:*"
    elif period:
        pattern = f"leaderboard:{period}:*"
    elif category:
        pattern = f"leaderboard:*:{category}:*"
    else:
        pattern = "leaderboard:*"
    
    delete_cache_pattern(pattern)

