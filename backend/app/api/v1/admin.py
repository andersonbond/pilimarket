"""
Admin endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import Optional, List
from datetime import datetime, timedelta

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.models.market import Market
from app.models.forecast import Forecast
from app.models.purchase import Purchase
from app.schemas.admin import (
    AdminStatsResponse,
    FlaggedItemsListResponse,
    FlaggedItemResponse,
    UserManagementListResponse,
    UserManagementResponse,
    MarketManagementListResponse,
    MarketManagementResponse,
    PurchaseMonitoringListResponse,
    PurchaseMonitoringResponse,
    SuspendMarketRequest,
    BanUserRequest,
    FreezeChipsRequest,
    FlagItemRequest,
    UnflagItemRequest,
)

router = APIRouter()


@router.get("/stats", response_model=dict)
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get admin dashboard statistics"""
    # Total counts
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_markets = db.query(func.count(Market.id)).scalar() or 0
    total_forecasts = db.query(func.count(Forecast.id)).scalar() or 0
    total_purchases = db.query(func.count(Purchase.id)).scalar() or 0
    
    # Total revenue (sum of all completed purchases)
    total_revenue_cents = (
        db.query(func.sum(Purchase.amount_cents))
        .filter(Purchase.status == "completed")
        .scalar() or 0
    )
    
    # Active users in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users_30d = (
        db.query(func.count(func.distinct(Forecast.user_id)))
        .filter(Forecast.created_at >= thirty_days_ago)
        .scalar() or 0
    )
    
    # Flagged items
    flagged_forecasts = db.query(func.count(Forecast.id)).filter(Forecast.is_flagged == True).scalar() or 0
    
    # Suspended markets
    suspended_markets_count = (
        db.query(func.count(Market.id)).filter(Market.status == "suspended").scalar() or 0
    )
    
    # Banned users
    banned_users_count = (
        db.query(func.count(User.id)).filter(User.is_banned == True).scalar() or 0
    )
    
    # Frozen accounts
    frozen_accounts_count = (
        db.query(func.count(User.id)).filter(User.chips_frozen == True).scalar() or 0
    )
    
    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "total_markets": total_markets,
            "total_forecasts": total_forecasts,
            "total_purchases": total_purchases,
            "total_revenue_cents": total_revenue_cents,
            "active_users_30d": active_users_30d,
            "flagged_items_count": flagged_forecasts,
            "suspended_markets_count": suspended_markets_count,
            "banned_users_count": banned_users_count,
            "frozen_accounts_count": frozen_accounts_count,
        },
    }


@router.get("/flagged", response_model=FlaggedItemsListResponse)
async def get_flagged_items(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    item_type: Optional[str] = Query(None, description="Filter by type: forecast, user, market"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get flagged items (forecasts, users, markets)"""
    flagged_items = []
    
    # Get flagged forecasts
    if not item_type or item_type == "forecast":
        forecast_query = db.query(Forecast).filter(Forecast.is_flagged == True)
        total_forecasts = forecast_query.count()
        forecasts = (
            forecast_query.order_by(desc(Forecast.created_at))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        
        for forecast in forecasts:
            flagged_items.append({
                "id": forecast.id,
                "type": "forecast",
                "reason": "Flagged by system or admin",
                "item_id": forecast.id,
                "flagged_at": forecast.created_at,
                "flagged_by": None,
                "status": "pending",
                "meta_data": {
                    "user_id": forecast.user_id,
                    "market_id": forecast.market_id,
                    "points": forecast.points,
                },
            })
    
    # Note: For MVP, we only flag forecasts. User and market flagging can be added later.
    
    return {
        "success": True,
        "data": {
            "items": flagged_items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(flagged_items),
                "pages": (len(flagged_items) + limit - 1) // limit,
            },
        },
    }


@router.post("/flag", response_model=dict)
async def flag_item(
    request: FlagItemRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Flag an item (forecast, user, or market)"""
    if request.item_type == "forecast":
        forecast = db.query(Forecast).filter(Forecast.id == request.item_id).first()
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")
        forecast.is_flagged = True
        db.commit()
        return {"success": True, "message": "Forecast flagged successfully"}
    elif request.item_type == "user":
        # For MVP, we'll just mark users as banned if flagged
        user = db.query(User).filter(User.id == request.item_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Note: In a full implementation, we'd have a separate flagging system
        return {"success": True, "message": "User flagging not fully implemented yet"}
    elif request.item_type == "market":
        # For MVP, we'll suspend markets if flagged
        market = db.query(Market).filter(Market.id == request.item_id).first()
        if not market:
            raise HTTPException(status_code=404, detail="Market not found")
        # Note: In a full implementation, we'd have a separate flagging system
        return {"success": True, "message": "Market flagging not fully implemented yet"}
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")


@router.post("/unflag", response_model=dict)
async def unflag_item(
    request: UnflagItemRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Unflag an item"""
    if request.item_type == "forecast":
        forecast = db.query(Forecast).filter(Forecast.id == request.item_id).first()
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")
        forecast.is_flagged = False
        db.commit()
        return {"success": True, "message": "Forecast unflagged successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid item type or not implemented")


@router.post("/markets/{market_id}/suspend", response_model=dict)
async def suspend_market(
    market_id: str,
    request: SuspendMarketRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Suspend a market"""
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    if market.status == "suspended":
        raise HTTPException(status_code=400, detail="Market is already suspended")
    
    if market.status == "resolved":
        raise HTTPException(status_code=400, detail="Cannot suspend a resolved market")
    
    market.status = "suspended"
    db.commit()
    
    return {"success": True, "message": f"Market {market_id} suspended successfully"}


@router.post("/markets/{market_id}/unsuspend", response_model=dict)
async def unsuspend_market(
    market_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Unsuspend a market"""
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    if market.status != "suspended":
        raise HTTPException(status_code=400, detail="Market is not suspended")
    
    market.status = "open"
    db.commit()
    
    return {"success": True, "message": f"Market {market_id} unsuspended successfully"}


@router.post("/users/{user_id}/ban", response_model=dict)
async def ban_user(
    user_id: str,
    request: BanUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Ban a user"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_banned:
        raise HTTPException(status_code=400, detail="User is already banned")
    
    user.is_banned = True
    user.is_active = False  # Also deactivate the account
    db.commit()
    
    return {"success": True, "message": f"User {user_id} banned successfully"}


@router.post("/users/{user_id}/unban", response_model=dict)
async def unban_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Unban a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_banned:
        raise HTTPException(status_code=400, detail="User is not banned")
    
    user.is_banned = False
    user.is_active = True  # Reactivate the account
    db.commit()
    
    return {"success": True, "message": f"User {user_id} unbanned successfully"}


@router.post("/users/{user_id}/freeze-chips", response_model=dict)
async def freeze_chips(
    user_id: str,
    request: FreezeChipsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Freeze or unfreeze a user's chips"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.chips_frozen = request.freeze
    db.commit()
    
    action = "frozen" if request.freeze else "unfrozen"
    return {"success": True, "message": f"User {user_id} chips {action} successfully"}


@router.get("/users", response_model=UserManagementListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by email or display name"),
    status_filter: Optional[str] = Query(None, description="Filter by status: active, banned, frozen"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get user management list"""
    query = db.query(User)
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.display_name.ilike(f"%{search}%"),
            )
        )
    
    # Status filter
    if status_filter == "banned":
        query = query.filter(User.is_banned == True)
    elif status_filter == "frozen":
        query = query.filter(User.chips_frozen == True)
    elif status_filter == "active":
        query = query.filter(and_(User.is_active == True, User.is_banned == False))
    
    total_count = query.count()
    
    users = (
        query.order_by(desc(User.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    
    user_list = []
    for user in users:
        # Get user stats
        total_forecasts = db.query(func.count(Forecast.id)).filter(Forecast.user_id == user.id).scalar() or 0
        total_purchases = db.query(func.count(Purchase.id)).filter(Purchase.user_id == user.id).scalar() or 0
        
        user_list.append({
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "contact_number": user.contact_number,
            "chips": user.chips,
            "reputation": user.reputation,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_admin": user.is_admin,
            "is_banned": user.is_banned,
            "chips_frozen": user.chips_frozen,
            "created_at": user.created_at,
            "last_login": user.last_login,
            "total_forecasts": total_forecasts,
            "total_purchases": total_purchases,
        })
    
    return {
        "success": True,
        "data": {
            "users": user_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        },
    }


@router.get("/markets", response_model=MarketManagementListResponse)
async def get_markets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by title"),
    status_filter: Optional[str] = Query(None, description="Filter by status: open, suspended, resolved, cancelled"),
    category_filter: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get market management list"""
    query = db.query(Market)
    
    # Search filter
    if search:
        query = query.filter(Market.title.ilike(f"%{search}%"))
    
    # Status filter
    if status_filter:
        query = query.filter(Market.status == status_filter)
    
    # Category filter
    if category_filter:
        query = query.filter(Market.category == category_filter)
    
    total_count = query.count()
    
    markets = (
        query.order_by(desc(Market.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    
    market_list = []
    for market in markets:
        # Get market stats
        total_forecasts = db.query(func.count(Forecast.id)).filter(Forecast.market_id == market.id).scalar() or 0
        total_points = (
            db.query(func.sum(Forecast.points)).filter(Forecast.market_id == market.id).scalar() or 0
        )
        is_flagged = (
            db.query(func.count(Forecast.id))
            .filter(and_(Forecast.market_id == market.id, Forecast.is_flagged == True))
            .scalar() or 0
        ) > 0
        
        market_list.append({
            "id": market.id,
            "title": market.title,
            "slug": market.slug,
            "category": market.category,
            "status": market.status,
            "created_by": market.created_by,
            "created_at": market.created_at,
            "end_date": market.end_date,
            "total_forecasts": total_forecasts,
            "total_points": total_points,
            "is_flagged": is_flagged,
        })
    
    return {
        "success": True,
        "data": {
            "markets": market_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        },
    }


@router.get("/purchases", response_model=PurchaseMonitoringListResponse)
async def get_purchases(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, completed, failed, refunded"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get purchase monitoring list"""
    query = db.query(Purchase)
    
    # User filter
    if user_id:
        query = query.filter(Purchase.user_id == user_id)
    
    # Status filter
    if status_filter:
        query = query.filter(Purchase.status == status_filter)
    
    # Date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(Purchase.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(Purchase.created_at <= end_dt)
        except ValueError:
            pass
    
    total_count = query.count()
    
    purchases = (
        query.order_by(desc(Purchase.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    
    purchase_list = []
    for purchase in purchases:
        # Get user info
        user = db.query(User).filter(User.id == purchase.user_id).first()
        
        purchase_list.append({
            "id": purchase.id,
            "user_id": purchase.user_id,
            "user_email": user.email if user else None,
            "user_display_name": user.display_name if user else None,
            "amount_cents": purchase.amount_cents,
            "chips_added": purchase.chips_added,
            "provider": purchase.provider,
            "provider_tx_id": purchase.provider_tx_id,
            "status": purchase.status,
            "created_at": purchase.created_at,
        })
    
    return {
        "success": True,
        "data": {
            "purchases": purchase_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        },
    }
