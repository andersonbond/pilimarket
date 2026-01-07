"""
Admin schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AdminStatsResponse(BaseModel):
    """Admin statistics response"""
    total_users: int
    total_markets: int
    total_forecasts: int
    total_purchases: int
    total_revenue_cents: int  # Total revenue in centavos
    active_users_30d: int
    flagged_items_count: int
    suspended_markets_count: int
    banned_users_count: int
    frozen_accounts_count: int


class FlaggedItemResponse(BaseModel):
    """Flagged item response"""
    id: str
    type: str  # 'forecast', 'user', 'market'
    reason: Optional[str] = None
    item_id: str
    flagged_at: datetime
    flagged_by: Optional[str] = None
    status: str  # 'pending', 'resolved', 'dismissed'
    meta_data: Dict[str, Any] = {}


class FlaggedItemsListResponse(BaseModel):
    """Flagged items list response"""
    success: bool
    data: Dict[str, Any]


class UserManagementResponse(BaseModel):
    """User management response"""
    id: str
    email: str
    display_name: str
    contact_number: str
    chips: int
    reputation: float
    is_active: bool
    is_verified: bool
    is_admin: bool
    is_banned: bool
    chips_frozen: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    total_forecasts: int
    total_purchases: int


class UserManagementListResponse(BaseModel):
    """User management list response"""
    success: bool
    data: Dict[str, Any]


class MarketManagementResponse(BaseModel):
    """Market management response"""
    id: str
    title: str
    slug: str
    category: str
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    end_date: Optional[datetime] = None
    total_forecasts: int
    total_points: int
    is_flagged: bool


class MarketManagementListResponse(BaseModel):
    """Market management list response"""
    success: bool
    data: Dict[str, Any]


class PurchaseMonitoringResponse(BaseModel):
    """Purchase monitoring response"""
    id: str
    user_id: str
    user_email: Optional[str] = None
    user_display_name: Optional[str] = None
    amount_cents: int
    chips_added: int
    provider: str
    provider_tx_id: Optional[str] = None
    status: str
    created_at: datetime


class PurchaseMonitoringListResponse(BaseModel):
    """Purchase monitoring list response"""
    success: bool
    data: Dict[str, Any]


class SuspendMarketRequest(BaseModel):
    """Suspend market request"""
    reason: Optional[str] = None


class BanUserRequest(BaseModel):
    """Ban user request"""
    reason: Optional[str] = None


class FreezeChipsRequest(BaseModel):
    """Freeze chips request"""
    reason: Optional[str] = None
    freeze: bool = True  # True to freeze, False to unfreeze


class FlagItemRequest(BaseModel):
    """Flag item request"""
    item_type: str  # 'forecast', 'user', 'market'
    item_id: str
    reason: str


class UnflagItemRequest(BaseModel):
    """Unflag item request"""
    item_type: str
    item_id: str

