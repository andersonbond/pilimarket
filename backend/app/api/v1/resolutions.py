"""
Resolution endpoints
"""
import uuid as uuid_module
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models.resolution import Resolution
from app.models.market import Market, Outcome
from app.models.forecast import Forecast
from app.models.user import User
from app.schemas.resolution import (
    ResolutionCreate,
    ResolutionResponse,
    ResolutionDetailResponse,
)
from app.dependencies import get_current_user_optional, require_admin

router = APIRouter()


def validate_evidence_urls(evidence_urls: list[str], market_category: str) -> None:
    """
    Validate evidence URLs based on market category
    - Minimum 1 URL for all markets
    - Minimum 2 URLs for election markets
    """
    min_urls = 2 if market_category.lower() == "election" else 1
    
    if len(evidence_urls) < min_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At least {min_urls} evidence URL(s) required for {market_category} markets",
        )
    
    # Validate URL format (basic check)
    for url in evidence_urls:
        if not url.startswith(("http://", "https://")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid evidence URL format: {url}. Must start with http:// or https://",
            )


def score_forecasts(db: Session, market_id: str, winning_outcome_id: str) -> dict:
    """
    Score all forecasts for a market:
    - Set status to 'won' for forecasts matching winning outcome
    - Set status to 'lost' for forecasts not matching winning outcome
    Returns counts of won/lost forecasts
    """
    # Get all forecasts for this market
    forecasts = db.query(Forecast).filter(Forecast.market_id == market_id).all()
    
    won_count = 0
    lost_count = 0
    
    for forecast in forecasts:
        if forecast.outcome_id == winning_outcome_id:
            forecast.status = "won"
            won_count += 1
        else:
            forecast.status = "lost"
            lost_count += 1
    
    db.commit()
    
    return {
        "won": won_count,
        "lost": lost_count,
        "total": len(forecasts),
    }


@router.post("/markets/{market_id}/resolve", response_model=dict, status_code=status.HTTP_201_CREATED)
async def resolve_market(
    market_id: str,
    resolution_data: ResolutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Resolve a market (admin only)
    
    This endpoint:
    1. Validates the market exists and is open
    2. Validates the outcome exists and belongs to the market
    3. Validates evidence URLs (min 1, min 2 for elections)
    4. Creates resolution record (immutable)
    5. Updates market status to 'resolved'
    6. Scores all forecasts (won/lost)
    """
    # Get market
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Check if market is already resolved
    if market.status == "resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Market is already resolved. Resolutions are immutable.",
        )
    
    # Validate market is not cancelled
    if market.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot resolve a cancelled market",
        )
    
    # Validate outcome exists and belongs to market
    outcome = db.query(Outcome).filter(
        Outcome.id == resolution_data.outcome_id,
        Outcome.market_id == market_id,
    ).first()
    
    if not outcome:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outcome not found or does not belong to this market",
        )
    
    # Validate evidence URLs
    validate_evidence_urls(resolution_data.evidence_urls, market.category)
    
    # Check if resolution already exists (shouldn't happen, but safety check)
    existing_resolution = db.query(Resolution).filter(Resolution.market_id == market_id).first()
    if existing_resolution:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution already exists for this market",
        )
    
    # Create resolution record
    resolution_id = str(uuid_module.uuid4())
    resolution = Resolution(
        id=resolution_id,
        market_id=market_id,
        outcome_id=resolution_data.outcome_id,
        resolved_by=current_user.id,
        evidence_urls=resolution_data.evidence_urls,  # Stored as JSON array
        resolution_note=resolution_data.resolution_note,
    )
    
    # Atomic transaction: Create resolution + Update market + Score forecasts
    try:
        db.add(resolution)
        
        # Update market status
        market.status = "resolved"
        market.resolution_outcome = resolution_data.outcome_id
        market.resolution_time = datetime.utcnow()
        
        db.flush()  # Ensure resolution is saved before scoring
        
        # Score all forecasts
        scoring_results = score_forecasts(db, market_id, resolution_data.outcome_id)
        
        # Create activity for market resolution
        from app.services.activity_service import create_activity
        create_activity(
            db,
            activity_type="market_resolved",
            market_id=market_id,
            metadata={
                "winning_outcome": winning_outcome.name,
                "resolved_by": current_user.id,
            }  # Will be stored as meta_data
        )
        
        # Get all users who forecasted on this market for notifications
        user_ids_with_forecasts = db.query(Forecast.user_id).filter(
            Forecast.market_id == market_id
        ).distinct().all()
        user_ids_list = [uid[0] for uid in user_ids_with_forecasts]
        
        # Create notifications in batch for all users who forecasted
        if user_ids_list:
            from app.services.notification_service import create_notifications_batch
            winning_outcome_obj = db.query(Outcome).filter(Outcome.id == resolution_data.outcome_id).first()
            create_notifications_batch(
                db,
                user_ids_list,
                notification_type="market_resolved",
            message=f"Market '{market.title}' has been resolved. Winning outcome: {winning_outcome_obj.name if winning_outcome_obj else 'Unknown'}",
            metadata={
                "market_id": market_id,
                "market_title": market.title,
                "outcome_id": resolution_data.outcome_id,
                "outcome_name": winning_outcome_obj.name if winning_outcome_obj else "Unknown",
            }  # This will be stored as meta_data in the model
            )
        
        # Recalculate reputation for all users who had forecasts on this market
        from app.services.reputation_service import calculate_reputation
        from app.models.reputation_history import ReputationHistory
        from app.models.user import User
        
        # Get unique user IDs who had forecasts
        user_ids = db.query(Forecast.user_id).filter(
            Forecast.market_id == market_id
        ).distinct().all()
        
        for (user_id,) in user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                # Calculate new reputation
                new_reputation = calculate_reputation(db, user_id)
                
                # Update user reputation
                user.reputation = new_reputation
                
                # Record in history
                history_entry = ReputationHistory(
                    id=str(uuid_module.uuid4()),
                    user_id=user_id,
                    reputation=new_reputation,
                    accuracy_score=None,  # Could calculate and store if needed
                    total_forecast_points=None,  # Could calculate and store if needed
                )
                db.add(history_entry)
                
                # Check and award badges
                from app.services.badge_service import check_and_award_badges
                check_and_award_badges(db, user_id)
                
                # Update streaks
                from app.services.streak_service import update_user_streaks
                update_user_streaks(db, user_id)
        
        db.commit()
        
        # Invalidate leaderboard cache after resolution
        from app.services.leaderboard_service import invalidate_leaderboard_cache
        invalidate_leaderboard_cache()
        db.refresh(resolution)
        db.refresh(market)
        
        return {
            "success": True,
            "data": {
                "resolution": ResolutionResponse.model_validate(resolution),
                "market": {
                    "id": market.id,
                    "status": market.status,
                    "resolution_outcome": market.resolution_outcome,
                    "resolution_time": market.resolution_time,
                },
                "scoring": scoring_results,
            },
            "message": f"Market resolved successfully. {scoring_results['won']} forecasts won, {scoring_results['lost']} forecasts lost.",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve market: {str(e)}",
        )


@router.get("/markets/{market_id}/resolution", response_model=dict)
async def get_market_resolution(
    market_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get resolution details for a market (public endpoint)
    """
    # Get market
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Get resolution
    resolution = db.query(Resolution).filter(Resolution.market_id == market_id).first()
    if not resolution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resolution not found for this market",
        )
    
    # Get outcome name
    outcome = db.query(Outcome).filter(Outcome.id == resolution.outcome_id).first()
    outcome_name = outcome.name if outcome else None
    
    # Get resolver name
    resolver = db.query(User).filter(User.id == resolution.resolved_by).first()
    resolver_name = resolver.display_name if resolver else None
    
    resolution_dict = {
        "id": resolution.id,
        "market_id": resolution.market_id,
        "outcome_id": resolution.outcome_id,
        "outcome_name": outcome_name,
        "resolved_by": resolution.resolved_by,
        "resolver_name": resolver_name,
        "evidence_urls": resolution.evidence_urls,
        "resolution_note": resolution.resolution_note,
        "created_at": resolution.created_at,
        "market_title": market.title,
    }
    
    return {
        "success": True,
        "data": {
            "resolution": ResolutionDetailResponse(**resolution_dict),
        },
    }

