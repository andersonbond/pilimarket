"""
Leaderboard endpoints
"""
from typing import Optional, List, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_optional
from app.models.user import User
from app.models.forecast import Forecast
from app.models.market import Market
from app.services.leaderboard_service import (
    get_cached_leaderboard,
    get_user_rank,
    invalidate_leaderboard_cache,
)

router = APIRouter()


@router.get("", response_model=dict)
async def get_leaderboard(
    period: str = Query("global", description="Period: global, weekly, or monthly"),
    category: Optional[str] = Query("all", description="Market category filter (all for all categories)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get leaderboard with optional period and category filtering
    
    Query Parameters:
    - period: "global", "weekly", or "monthly" (default: global)
    - category: Market category or "all" (default: all)
    - page: Page number (default: 1)
    - limit: Results per page (default: 50, max: 100)
    
    Returns:
    - leaderboard: List of ranked users
    - user_rank: Current user's rank (if authenticated)
    - pagination: Pagination metadata
    """
    # Validate period
    if period not in ["global", "weekly", "monthly"]:
        period = "global"
    
    # Normalize category
    if category == "all" or category is None:
        category = None
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get leaderboard (get more than needed for pagination)
    leaderboard = get_cached_leaderboard(db, period, category, limit=1000)
    
    # Apply pagination
    total = len(leaderboard)
    paginated_leaderboard = leaderboard[offset:offset + limit]
    
    # Get user's rank if authenticated
    user_rank = None
    if current_user:
        user_rank = get_user_rank(db, current_user.id, period, category)
    
    # Calculate pagination metadata
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "leaderboard": paginated_leaderboard,
            "user_rank": user_rank,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }


@router.get("/biggest-wins", response_model=dict)
async def get_biggest_wins(
    limit: int = Query(8, ge=1, le=50, description="Number of wins to return"),
    db: Session = Depends(get_db),
):
    """
    Get biggest wins from resolved markets in the current month
    
    Returns:
    - List of biggest wins with user info, market title, and profit
    """
    # Get start of current month
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    # Get all won forecasts from resolved markets this month
    won_forecasts = (
        db.query(Forecast)
        .join(Market, Forecast.market_id == Market.id)
        .filter(
            Forecast.status == 'won',
            Market.status == 'resolved',
            Market.resolution_time >= month_start,
        )
        .order_by(Forecast.created_at.desc())
        .all()
    )
    
    # Group by user and market to get the biggest win per user per market
    wins_by_user_market: Dict[str, Dict] = {}
    
    for forecast in won_forecasts:
        key = f"{forecast.user_id}_{forecast.market_id}"
        
        if key not in wins_by_user_market:
            # Get market info
            market = db.query(Market).filter(Market.id == forecast.market_id).first()
            user = db.query(User).filter(User.id == forecast.user_id).first()
            
            if not market or not user:
                continue
            
            # Calculate actual profit from stored reward_amount
            # Initial bet = forecast.points
            # Actual reward = forecast.reward_amount (if available) or estimate
            initial_amount = forecast.points
            if forecast.reward_amount is not None:
                # Use actual reward amount if available
                final_amount = forecast.reward_amount
                profit = final_amount - initial_amount
            else:
                # Fallback to estimated profit for older forecasts without reward_amount
                estimated_profit = int(forecast.points * 0.5)  # Simplified: 50% profit on average
                final_amount = initial_amount + estimated_profit
                profit = estimated_profit
            
            wins_by_user_market[key] = {
                'user_id': user.id,
                'display_name': user.display_name,
                'avatar_url': user.avatar_url,
                'market_id': market.id,
                'market_title': market.title,
                'initial_amount': initial_amount,
                'final_amount': final_amount,
                'profit': profit,
                'resolved_at': market.resolution_time,
            }
        else:
            # If user has multiple forecasts on same market, aggregate
            additional_initial = forecast.points
            if forecast.reward_amount is not None:
                additional_final = forecast.reward_amount
                additional_profit = additional_final - additional_initial
            else:
                # Fallback to estimated for older forecasts
                additional_profit = int(forecast.points * 0.5)
                additional_final = additional_initial + additional_profit
            
            wins_by_user_market[key]['initial_amount'] += additional_initial
            wins_by_user_market[key]['profit'] += additional_profit
            wins_by_user_market[key]['final_amount'] = (
                wins_by_user_market[key]['initial_amount'] + wins_by_user_market[key]['profit']
            )
    
    # Sort by profit (descending) and take top N
    biggest_wins = sorted(
        wins_by_user_market.values(),
        key=lambda x: x['profit'],
        reverse=True
    )[:limit]
    
    # Add rank
    for i, win in enumerate(biggest_wins, start=1):
        win['rank'] = i
    
    return {
        "success": True,
        "data": {
            "wins": biggest_wins,
        },
        "errors": None,
    }


@router.post("/invalidate", response_model=dict)
async def invalidate_cache(
    period: Optional[str] = Query(None, description="Period to invalidate (all if not specified)"),
    category: Optional[str] = Query(None, description="Category to invalidate (all if not specified)"),
):
    """
    Invalidate leaderboard cache (admin only - can be added later)
    
    For now, this is a simple endpoint. In production, add admin authentication.
    """
    invalidate_leaderboard_cache(period, category)
    
    return {
        "success": True,
        "data": {"message": "Leaderboard cache invalidated"},
        "errors": None,
    }

