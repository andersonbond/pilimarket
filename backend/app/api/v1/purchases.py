"""
Purchase endpoints
"""
import uuid as uuid_module
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.purchase import Purchase
from app.models.user import User
from app.schemas.purchase import PurchaseCreate, PurchaseResponse, PurchaseListResponse
from app.dependencies import get_current_user
from app.config import CHIP_TO_PESO_RATIO  # Module-level constant

router = APIRouter()

# Purchase limits (for testing)
MIN_CHIPS_PER_PURCHASE = 20  # Minimum ₱20
MAX_CHIPS_PER_PURCHASE = 100000  # Maximum ₱100,000
MAX_DAILY_PURCHASE_LIMIT = 500000  # Maximum ₱500,000 per day


@router.post("/checkout", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_checkout(
    purchase_data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a chip purchase (TEST MODE - bypasses payment)
    
    For testing purposes, this endpoint directly credits chips without payment processing.
    In production, this would create a payment intent with a payment provider.
    
    IMPORTANT: Chips are non-redeemable and have no monetary value.
    """
    # Validate chip amount
    if purchase_data.chips_added < MIN_CHIPS_PER_PURCHASE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum purchase is {MIN_CHIPS_PER_PURCHASE} chips (₱{MIN_CHIPS_PER_PURCHASE})",
        )
    
    if purchase_data.chips_added > MAX_CHIPS_PER_PURCHASE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum purchase is {MAX_CHIPS_PER_PURCHASE} chips (₱{MAX_CHIPS_PER_PURCHASE})",
        )
    
    # Check daily purchase limit
    from datetime import datetime, timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_purchases = db.query(Purchase).filter(
        Purchase.user_id == current_user.id,
        Purchase.status == "completed",
        Purchase.created_at >= today_start,
    ).all()
    
    today_total = sum(p.chips_added for p in today_purchases)
    if today_total + purchase_data.chips_added > MAX_DAILY_PURCHASE_LIMIT:
        remaining = MAX_DAILY_PURCHASE_LIMIT - today_total
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Daily purchase limit reached. You can purchase up to {remaining} more chips today.",
        )
    
    # Calculate amount in centavos (1 chip = ₱1.00 = 100 cents)
    amount_cents = int(purchase_data.chips_added * 100 * CHIP_TO_PESO_RATIO)
    
    # Create purchase record
    purchase_id = str(uuid_module.uuid4())
    purchase = Purchase(
        id=purchase_id,
        user_id=current_user.id,
        amount_cents=amount_cents,
        chips_added=purchase_data.chips_added,
        provider="test",  # Test mode - no actual payment
        provider_tx_id=f"test_{purchase_id}",  # Test transaction ID
        status="completed",  # In test mode, immediately complete
    )
    
    # Atomically: Create purchase + credit chips
    try:
        db.add(purchase)
        current_user.chips += purchase_data.chips_added
        db.commit()
        db.refresh(purchase)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process purchase",
        )
    
    return {
        "success": True,
        "data": {
            "purchase": PurchaseResponse.model_validate(purchase),
            "new_balance": current_user.chips,
        },
        "message": f"Successfully purchased {purchase_data.chips_added} chips (₱{purchase_data.chips_added})",
    }


@router.get("", response_model=dict)
async def get_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
):
    """
    Get user's purchase history
    """
    query = db.query(Purchase).filter(Purchase.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Purchase.status == status_filter)
    
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    purchases = query.order_by(desc(Purchase.created_at)).offset(offset).limit(limit).all()
    
    purchase_responses = [PurchaseResponse.model_validate(p) for p in purchases]
    
    return {
        "success": True,
        "data": {
            "purchases": purchase_responses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        },
    }


@router.get("/{purchase_id}", response_model=dict)
async def get_purchase(
    purchase_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific purchase by ID
    """
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.user_id == current_user.id,
    ).first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found",
        )
    
    return {
        "success": True,
        "data": {
            "purchase": PurchaseResponse.model_validate(purchase),
        },
    }
