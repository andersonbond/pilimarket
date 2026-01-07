"""
Badge system service
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.models.user import User
from app.models.forecast import Forecast
from app.models.market import Market
from app.models.resolution import Resolution
from app.services.reputation_service import calculate_reputation, get_user_forecast_stats


# Badge definitions
BADGE_DEFINITIONS = {
    "newbie": {
        "name": "Newbie",
        "description": "Made your first 10 forecasts",
        "icon": "🌱",
        "color": "gray",
    },
    "accurate": {
        "name": "Accurate Forecaster",
        "description": "Achieved Brier score < 0.25 (top 20%)",
        "icon": "🎯",
        "color": "blue",
    },
    "climber": {
        "name": "Climber",
        "description": "Improved reputation for 3 consecutive weeks",
        "icon": "📈",
        "color": "green",
    },
    "specialist": {
        "name": "Specialist",
        "description": "Top 10% in a specific category",
        "icon": "⭐",
        "color": "purple",
    },
    "veteran": {
        "name": "Veteran",
        "description": "Made 100+ forecasts",
        "icon": "🏆",
        "color": "gold",
    },
    "perfect_week": {
        "name": "Perfect Week",
        "description": "Won all forecasts in a week (min 5 forecasts)",
        "icon": "✨",
        "color": "yellow",
    },
}


def check_newbie_badge(db: Session, user_id: str) -> bool:
    """Check if user qualifies for Newbie badge (10+ forecasts)"""
    forecast_count = db.query(Forecast).filter(Forecast.user_id == user_id).count()
    return forecast_count >= 10


def check_accurate_badge(db: Session, user_id: str) -> bool:
    """Check if user qualifies for Accurate badge (accuracy > 75%)"""
    from app.services.reputation_service import calculate_brier_score
    
    forecasts = db.query(Forecast).filter(
        Forecast.user_id == user_id,
        Forecast.status.in_(['won', 'lost'])
    ).all()
    
    if len(forecasts) < 5:  # Need at least 5 resolved forecasts
        return False
    
    # Get markets
    market_ids = [f.market_id for f in forecasts]
    markets = {
        market.id: market
        for market in db.query(Market).filter(Market.id.in_(market_ids)).all()
    }
    
    # Load outcomes
    from app.models.market import Outcome
    for market in markets.values():
        market.outcomes = db.query(Outcome).filter(Outcome.market_id == market.id).all()
    
    # calculate_brier_score returns accuracy (0-1, higher is better)
    accuracy = calculate_brier_score(forecasts, markets)
    # Accurate badge: accuracy > 75%
    return accuracy > 0.75


def check_veteran_badge(db: Session, user_id: str) -> bool:
    """Check if user qualifies for Veteran badge (100+ forecasts)"""
    forecast_count = db.query(Forecast).filter(Forecast.user_id == user_id).count()
    return forecast_count >= 100


def check_perfect_week_badge(db: Session, user_id: str) -> bool:
    """Check if user qualifies for Perfect Week badge (won all forecasts in a week, min 5)"""
    # Get forecasts from the last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_forecasts = db.query(Forecast).filter(
        Forecast.user_id == user_id,
        Forecast.created_at >= week_ago,
        Forecast.status.in_(['won', 'lost'])
    ).all()
    
    if len(recent_forecasts) < 5:
        return False
    
    # Check if all are won
    return all(f.status == 'won' for f in recent_forecasts)


def check_specialist_badge(db: Session, user_id: str, category: str) -> bool:
    """
    Check if user qualifies for Specialist badge in a category (top 10%)
    This is a simplified version - in production, would compare against all users
    """
    # Get user's accuracy in this category
    category_markets = db.query(Market).filter(Market.category == category).all()
    market_ids = [m.id for m in category_markets]
    
    user_forecasts = db.query(Forecast).filter(
        Forecast.user_id == user_id,
        Forecast.market_id.in_(market_ids),
        Forecast.status.in_(['won', 'lost'])
    ).all()
    
    if len(user_forecasts) < 5:
        return False
    
    won_count = sum(1 for f in user_forecasts if f.status == 'won')
    accuracy = won_count / len(user_forecasts)
    
    # Simplified: if accuracy > 70%, consider them top 10%
    # In production, would compare against all users' accuracies in this category
    return accuracy > 0.70


def check_and_award_badges(db: Session, user_id: str) -> List[str]:
    """
    Check all badge criteria and award eligible badges
    
    Returns:
        List of newly awarded badge IDs
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    # Get current badges (stored as JSON in user model)
    current_badges = getattr(user, 'badges', [])
    if current_badges is None:
        current_badges = []
    if not isinstance(current_badges, list):
        # If stored as string or other format, try to parse
        import json
        try:
            if isinstance(current_badges, str):
                current_badges = json.loads(current_badges) if current_badges else []
            else:
                current_badges = []
        except:
            current_badges = []
    
    newly_awarded = []
    
    # Check each badge type
    badge_checks = {
        "newbie": check_newbie_badge,
        "accurate": check_accurate_badge,
        "veteran": check_veteran_badge,
        "perfect_week": check_perfect_week_badge,
    }
    
    for badge_id, check_func in badge_checks.items():
        if badge_id not in current_badges:
            if check_func(db, user_id):
                current_badges.append(badge_id)
                newly_awarded.append(badge_id)
    
    # Check specialist badges for each category
    categories = ['election', 'politics', 'sports', 'entertainment', 'economy', 'weather']
    for category in categories:
        badge_id = f"specialist_{category}"
        if badge_id not in current_badges:
            if check_specialist_badge(db, user_id, category):
                current_badges.append(badge_id)
                newly_awarded.append(badge_id)
    
    # Update user badges
    if newly_awarded:
        # Store as JSON (SQLAlchemy handles JSON column automatically)
        user.badges = current_badges if current_badges else []
        db.commit()
        
        # Create notification for each newly awarded badge
        from app.services.notification_service import create_notification
        from app.services.activity_service import create_activity
        
        badge_names = {
            "newbie": "Newbie",
            "accurate": "Accurate Forecaster",
            "veteran": "Veteran",
            "perfect_week": "Perfect Week",
        }
        
        for badge_id in newly_awarded:
            # Get badge name
            badge_name = badge_names.get(badge_id, badge_id.replace("_", " ").title())
            if badge_id.startswith("specialist_"):
                category = badge_id.replace("specialist_", "")
                badge_name = f"{category.title()} Specialist"
            
            # Create notification
            create_notification(
                db,
                user_id=user_id,
                notification_type="badge_earned",
                message=f"Congratulations! You earned the '{badge_name}' badge!",
                metadata={"badge_id": badge_id, "badge_name": badge_name}  # Will be stored as meta_data
            )
            
            # Create activity
            create_activity(
                db,
                activity_type="badge_earned",
                user_id=user_id,
                metadata={"badge_id": badge_id, "badge_name": badge_name}  # Will be stored as meta_data
            )
    
    return newly_awarded


def get_user_badges(user: User) -> List[Dict]:
    """
    Get formatted badge list for a user
    
    Returns:
        List of badge dictionaries with metadata
    """
    badges = getattr(user, 'badges', [])
    if badges is None:
        badges = []
    if not isinstance(badges, list):
        # If stored as string or other format, try to parse
        import json
        try:
            if isinstance(badges, str):
                badges = json.loads(badges) if badges else []
            else:
                badges = []
        except:
            badges = []
    
    result = []
    for badge_id in badges:
        if badge_id.startswith("specialist_"):
            category = badge_id.replace("specialist_", "")
            badge_def = {
                "id": badge_id,
                "name": f"{category.title()} Specialist",
                "description": f"Top 10% in {category} markets",
                "icon": "⭐",
                "color": "purple",
            }
        else:
            badge_def = BADGE_DEFINITIONS.get(badge_id, {
                "id": badge_id,
                "name": badge_id.title(),
                "description": "Badge earned",
                "icon": "🏅",
                "color": "gray",
            })
            badge_def["id"] = badge_id
        
        result.append(badge_def)
    
    return result

