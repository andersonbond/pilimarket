"""
Forecast endpoints
"""
import uuid as uuid_module
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.database import get_db
from app.models.forecast import Forecast
from app.models.market import Market, Outcome
from app.models.user import User
from app.schemas.forecast import (
    ForecastCreate,
    ForecastUpdate,
    ForecastResponse,
    ForecastDetailResponse,
)
from app.dependencies import get_current_user, get_current_user_optional

router = APIRouter()

# Forecast limits
MAX_FORECASTS_PER_DAY = 50
MAX_FORECASTS_PER_MINUTE = 10


@router.post("/markets/{market_id}/forecast", response_model=dict, status_code=status.HTTP_201_CREATED)
async def place_forecast(
    market_id: str,
    forecast_data: ForecastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Place a forecast on a market
    
    This endpoint:
    1. Validates the market is open
    2. Validates the user has enough chips
    3. Validates per-market and daily limits
    4. Atomically: debits chips, creates forecast, updates outcome totals
    """
    # Get market
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Validate market is open
    if market.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Market is {market.status}. Only open markets can be forecasted.",
        )
    
    # Validate outcome exists and belongs to market
    outcome = db.query(Outcome).filter(
        Outcome.id == forecast_data.outcome_id,
        Outcome.market_id == market_id,
    ).first()
    
    if not outcome:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outcome not found or does not belong to this market",
        )
    
    # Check if user's chips are frozen
    if current_user.chips_frozen:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your chips are frozen. Please contact support.",
        )
    
    # Validate user has enough chips
    if current_user.chips < forecast_data.points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient chips. You have ₱{current_user.chips}, but need ₱{forecast_data.points}",
        )
    
    # Check if user already has a forecast on this market
    existing_forecast = db.query(Forecast).filter(
        Forecast.user_id == current_user.id,
        Forecast.market_id == market_id,
    ).first()
    
    if existing_forecast:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a forecast on this market. Use the update endpoint to modify it.",
        )
    
    # Validate per-market limit
    user_forecasts_on_market = db.query(Forecast).filter(
        Forecast.user_id == current_user.id,
        Forecast.market_id == market_id,
    ).all()
    
    total_points_on_market = sum(f.points for f in user_forecasts_on_market)
    if total_points_on_market + forecast_data.points > market.max_points_per_user:
        remaining = market.max_points_per_user - total_points_on_market
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Per-market limit exceeded. You can allocate up to ₱{remaining} more on this market (max: ₱{market.max_points_per_user})",
        )
    
    # Validate daily forecast limit
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_forecasts = db.query(Forecast).filter(
        Forecast.user_id == current_user.id,
        Forecast.created_at >= today_start,
    ).count()
    
    if today_forecasts >= MAX_FORECASTS_PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Daily forecast limit reached. Maximum {MAX_FORECASTS_PER_DAY} forecasts per day.",
        )
    
    # Rate limiting: Check forecasts in last minute
    one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
    recent_forecasts = db.query(Forecast).filter(
        Forecast.user_id == current_user.id,
        Forecast.created_at >= one_minute_ago,
    ).count()
    
    if recent_forecasts >= MAX_FORECASTS_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {MAX_FORECASTS_PER_MINUTE} forecasts per minute.",
        )
    
    # Atomic transaction: Debit chips + Create forecast + Update outcome totals
    forecast_id = str(uuid_module.uuid4())
    
    try:
        # Debit chips from user
        current_user.chips -= forecast_data.points
        
        # Create forecast
        forecast = Forecast(
            id=forecast_id,
            user_id=current_user.id,
            market_id=market_id,
            outcome_id=forecast_data.outcome_id,
            points=forecast_data.points,
            status="pending",
            is_flagged=False,
        )
        db.add(forecast)
        
        # Update outcome total_points
        outcome.total_points += forecast_data.points
        
        db.commit()
        db.refresh(forecast)
        db.refresh(current_user)
        db.refresh(outcome)
        
        # Create activity for forecast placement
        from app.services.activity_service import create_activity
        create_activity(
            db,
            activity_type="forecast_placed",
            user_id=current_user.id,
            market_id=market_id,
            metadata={
                "forecast_id": forecast_id,
                "outcome_id": forecast_data.outcome_id,
                "outcome_name": outcome.name,
                "points": forecast_data.points,
            }  # Will be stored as meta_data
        )
        db.commit()  # Commit activity
        
        return {
            "success": True,
            "data": {
                "forecast": ForecastResponse.model_validate(forecast),
                "new_balance": current_user.chips,
                "updated_outcome": {
                    "id": outcome.id,
                    "name": outcome.name,
                    "total_points": outcome.total_points,
                },
            },
            "message": f"Forecast placed successfully. {forecast_data.points} chips allocated to '{outcome.name}'",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to place forecast. Transaction rolled back.",
        )


@router.patch("/forecasts/{forecast_id}", response_model=dict)
async def update_forecast(
    forecast_id: str,
    forecast_data: ForecastUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing forecast
    
    Allows changing the outcome or points (within limits)
    """
    forecast = db.query(Forecast).filter(
        Forecast.id == forecast_id,
        Forecast.user_id == current_user.id,
    ).first()
    
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found",
        )
    
    # Get market
    market = db.query(Market).filter(Market.id == forecast.market_id).first()
    if not market or market.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update forecast on a closed market",
        )
    
    # Get old outcome
    old_outcome = db.query(Outcome).filter(Outcome.id == forecast.outcome_id).first()
    
    # Calculate points change
    points_change = 0
    if forecast_data.points is not None:
        points_change = forecast_data.points - forecast.points
    
    # Validate new outcome if provided
    new_outcome = None
    if forecast_data.outcome_id:
        new_outcome = db.query(Outcome).filter(
            Outcome.id == forecast_data.outcome_id,
            Outcome.market_id == forecast.market_id,
        ).first()
        
        if not new_outcome:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="New outcome not found or does not belong to this market",
            )
    
    # Validate user has enough chips if increasing points
    if points_change > 0 and current_user.chips < points_change:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient chips. You have ₱{current_user.chips}, but need ₱{points_change} more",
        )
    
    # Validate per-market limit
    if forecast_data.points:
        user_forecasts_on_market = db.query(Forecast).filter(
            Forecast.user_id == current_user.id,
            Forecast.market_id == forecast.market_id,
            Forecast.id != forecast_id,  # Exclude current forecast
        ).all()
        
        total_points_on_market = sum(f.points for f in user_forecasts_on_market)
        if total_points_on_market + forecast_data.points > market.max_points_per_user:
            remaining = market.max_points_per_user - total_points_on_market
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Per-market limit exceeded. You can allocate up to ₱{remaining} more on this market",
            )
    
    # Atomic transaction: Update chips + Update forecast + Update outcome totals
    try:
        # Store old values for outcome updates
        old_points = forecast.points
        old_outcome_id = forecast.outcome_id
        new_points = forecast_data.points if forecast_data.points is not None else old_points
        new_outcome_id = forecast_data.outcome_id if forecast_data.outcome_id else old_outcome_id
        
        # Update user chips
        if points_change != 0:
            current_user.chips -= points_change
        
        # Update forecast
        if forecast_data.outcome_id:
            forecast.outcome_id = forecast_data.outcome_id
        if forecast_data.points is not None:
            forecast.points = forecast_data.points
        
        # Update outcome totals
        # Remove old points from old outcome
        if old_outcome:
            old_outcome.total_points -= old_points
        
        # Add new points to new outcome
        if new_outcome_id != old_outcome_id:
            # Different outcome - add to new outcome
            if new_outcome:
                new_outcome.total_points += new_points
        else:
            # Same outcome - just adjust points difference
            if old_outcome:
                old_outcome.total_points += new_points
        
        db.commit()
        db.refresh(forecast)
        db.refresh(current_user)
        
        return {
            "success": True,
            "data": {
                "forecast": ForecastResponse.model_validate(forecast),
                "new_balance": current_user.chips,
            },
            "message": "Forecast updated successfully",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update forecast. Transaction rolled back.",
        )


@router.get("/users/{user_id}/forecasts", response_model=dict)
async def get_user_forecasts(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    market_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
):
    """
    Get forecasts for a user
    
    Users can only view their own forecasts unless they're viewing public data
    """
    # Users can only view their own forecasts
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own forecasts",
        )
    
    query = db.query(Forecast).filter(Forecast.user_id == user_id)
    
    if market_id:
        query = query.filter(Forecast.market_id == market_id)
    
    if status_filter:
        query = query.filter(Forecast.status == status_filter)
    
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    forecasts = query.order_by(desc(Forecast.created_at)).offset(offset).limit(limit).all()
    
    # Enrich with outcome and market names
    forecast_details = []
    for forecast in forecasts:
        outcome = db.query(Outcome).filter(Outcome.id == forecast.outcome_id).first()
        market = db.query(Market).filter(Market.id == forecast.market_id).first()
        
        forecast_dict = ForecastResponse.model_validate(forecast).model_dump()
        forecast_dict["outcome_name"] = outcome.name if outcome else None
        forecast_dict["market_title"] = market.title if market else None
        
        forecast_details.append(ForecastDetailResponse(**forecast_dict))
    
    return {
        "success": True,
        "data": {
            "forecasts": forecast_details,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        },
    }


@router.get("/markets/{market_id}/forecasts", response_model=dict)
async def get_market_forecasts(
    market_id: str,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get all forecasts for a market
    
    Returns the current user's forecast if they have one
    """
    # Verify market exists
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    query = db.query(Forecast).filter(Forecast.market_id == market_id)
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    forecasts = query.order_by(desc(Forecast.created_at)).offset(offset).limit(limit).all()
    
    # Get current user's forecast if authenticated
    user_forecast = None
    if current_user:
        user_forecast_obj = db.query(Forecast).filter(
            Forecast.user_id == current_user.id,
            Forecast.market_id == market_id,
        ).first()
        
        if user_forecast_obj:
            outcome = db.query(Outcome).filter(Outcome.id == user_forecast_obj.outcome_id).first()
            forecast_dict = ForecastResponse.model_validate(user_forecast_obj).model_dump()
            forecast_dict["outcome_name"] = outcome.name if outcome else None
            forecast_dict["market_title"] = market.title
            user_forecast = ForecastDetailResponse(**forecast_dict)
    
    # Enrich forecasts with outcome names
    forecast_details = []
    for forecast in forecasts:
        outcome = db.query(Outcome).filter(Outcome.id == forecast.outcome_id).first()
        forecast_dict = ForecastResponse.model_validate(forecast).model_dump()
        forecast_dict["outcome_name"] = outcome.name if outcome else None
        forecast_dict["market_title"] = market.title
        forecast_details.append(ForecastDetailResponse(**forecast_dict))
    
    return {
        "success": True,
        "data": {
            "forecasts": forecast_details,
            "user_forecast": user_forecast.model_dump() if user_forecast else None,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        },
    }


@router.delete("/forecasts/{forecast_id}", response_model=dict)
async def cancel_forecast(
    forecast_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a forecast and refund chips
    
    Only allowed on open markets
    """
    forecast = db.query(Forecast).filter(
        Forecast.id == forecast_id,
        Forecast.user_id == current_user.id,
    ).first()
    
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found",
        )
    
    # Get market
    market = db.query(Market).filter(Market.id == forecast.market_id).first()
    if not market or market.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel forecast on a closed market",
        )
    
    # Get outcome
    outcome = db.query(Outcome).filter(Outcome.id == forecast.outcome_id).first()
    
    # Atomic transaction: Refund chips + Delete forecast + Update outcome totals
    try:
        # Refund chips
        current_user.chips += forecast.points
        
        # Update outcome totals
        if outcome:
            outcome.total_points -= forecast.points
        
        # Delete forecast
        db.delete(forecast)
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "data": {
                "new_balance": current_user.chips,
            },
            "message": f"Forecast cancelled. {forecast.points} chips refunded.",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel forecast. Transaction rolled back.",
        )
