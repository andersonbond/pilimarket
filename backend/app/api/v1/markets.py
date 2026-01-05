"""
Market endpoints
"""
import uuid as uuid_module
import os
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from starlette.requests import Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from slugify import slugify

from app.database import get_db
from app.models.market import Market, Outcome
from app.models.user import User
from app.schemas.market import (
    MarketCreate,
    MarketUpdate,
    MarketResponse,
    MarketDetailResponse,
    MarketListResponse,
    OutcomeCreate,
)
from app.dependencies import get_current_user, get_current_user_id
from app.config import settings

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/markets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require admin privileges"""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def generate_unique_slug(db: Session, title: str, existing_slug: Optional[str] = None) -> str:
    """Generate a unique slug from title"""
    base_slug = slugify(title)
    slug = base_slug
    
    # If updating, exclude current market from slug check
    query = db.query(Market).filter(Market.slug == slug)
    if existing_slug:
        query = query.filter(Market.slug != existing_slug)
    
    counter = 1
    while query.first():
        slug = f"{base_slug}-{counter}"
        query = db.query(Market).filter(Market.slug == slug)
        if existing_slug:
            query = query.filter(Market.slug != existing_slug)
        counter += 1
    
    return slug


@router.get("", response_model=MarketListResponse)
async def list_markets(
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """List markets with filters and pagination"""
    query = db.query(Market)
    
    # Apply filters
    if category:
        query = query.filter(Market.category == category)
    
    if status_filter:
        query = query.filter(Market.status == status_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Market.title.ilike(search_term),
                Market.description.ilike(search_term),
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    markets = query.order_by(desc(Market.created_at)).offset(offset).limit(limit).all()
    
    # Include outcomes for each market
    market_responses = []
    for market in markets:
        market_dict = {
            "id": market.id,
            "title": market.title,
            "slug": market.slug,
            "description": market.description,
            "rules": market.rules,
            "image_url": market.image_url,
            "category": market.category,
            "meta_data": market.meta_data or {},
            "max_points_per_user": market.max_points_per_user,
            "status": market.status,
            "resolution_outcome": market.resolution_outcome,
            "resolution_time": market.resolution_time,
            "created_by": market.created_by,
            "created_at": market.created_at,
            "updated_at": market.updated_at,
            "outcomes": [
                {
                    "id": outcome.id,
                    "market_id": outcome.market_id,
                    "name": outcome.name,
                    "total_points": outcome.total_points,
                    "created_at": outcome.created_at,
                }
                for outcome in market.outcomes
            ],
        }
        market_responses.append(MarketResponse(**market_dict))
    
    return {
        "success": True,
        "data": {
            "markets": market_responses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.get("/{market_id}", response_model=dict)
async def get_market(market_id: str, db: Session = Depends(get_db)):
    """Get market detail with consensus"""
    market = db.query(Market).filter(Market.id == market_id).first()
    
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Calculate consensus
    total_points = sum(outcome.total_points for outcome in market.outcomes)
    consensus = {}
    
    if total_points > 0:
        for outcome in market.outcomes:
            percentage = (outcome.total_points / total_points) * 100
            consensus[outcome.name] = round(percentage, 2)
    
    market_dict = {
        "id": market.id,
        "title": market.title,
        "slug": market.slug,
        "description": market.description,
        "rules": market.rules,
        "image_url": market.image_url,
        "category": market.category,
        "meta_data": market.meta_data or {},
        "max_points_per_user": market.max_points_per_user,
        "status": market.status,
        "resolution_outcome": market.resolution_outcome,
        "resolution_time": market.resolution_time,
        "created_by": market.created_by,
        "created_at": market.created_at,
        "updated_at": market.updated_at,
        "outcomes": [
            {
                "id": outcome.id,
                "market_id": outcome.market_id,
                "name": outcome.name,
                "total_points": outcome.total_points,
                "created_at": outcome.created_at,
            }
            for outcome in market.outcomes
        ],
        "consensus": consensus,
        "total_volume": total_points,
    }
    
    return {
        "success": True,
        "data": {
            "market": MarketDetailResponse(**market_dict),
        },
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_market(
    market_data: MarketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new market (admin only)"""
    # Generate slug
    slug = generate_unique_slug(db, market_data.title)
    
    # Create market
    market = Market(
        id=str(uuid_module.uuid4()),
        title=market_data.title,
        slug=slug,
        description=market_data.description,
        rules=market_data.rules,
        image_url=market_data.image_url,
        category=market_data.category,
        meta_data=market_data.meta_data or {},
        max_points_per_user=market_data.max_points_per_user,
        created_by=current_user.id,
        status="open",
    )
    
    db.add(market)
    db.flush()  # Get market ID
    
    # Create outcomes
    for outcome_data in market_data.outcomes:
        outcome = Outcome(
            id=str(uuid_module.uuid4()),
            market_id=market.id,
            name=outcome_data.name,
            total_points=0,
        )
        db.add(outcome)
    
    db.commit()
    db.refresh(market)
    
    # Return created market
    market_dict = {
        "id": market.id,
        "title": market.title,
        "slug": market.slug,
        "description": market.description,
        "rules": market.rules,
        "image_url": market.image_url,
        "category": market.category,
        "meta_data": market.meta_data or {},
        "max_points_per_user": market.max_points_per_user,
        "status": market.status,
        "resolution_outcome": market.resolution_outcome,
        "resolution_time": market.resolution_time,
        "created_by": market.created_by,
        "created_at": market.created_at,
        "updated_at": market.updated_at,
        "outcomes": [
            {
                "id": outcome.id,
                "market_id": outcome.market_id,
                "name": outcome.name,
                "total_points": outcome.total_points,
                "created_at": outcome.created_at,
            }
            for outcome in market.outcomes
        ],
    }
    
    return {
        "success": True,
        "data": {
            "market": MarketResponse(**market_dict),
        },
        "message": "Market created successfully",
    }


@router.patch("/{market_id}", response_model=dict)
async def update_market(
    market_id: str,
    market_data: MarketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a market (admin only)"""
    market = db.query(Market).filter(Market.id == market_id).first()
    
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Update fields
    if market_data.title is not None:
        market.title = market_data.title
        # Regenerate slug if title changed
        market.slug = generate_unique_slug(db, market_data.title, existing_slug=market.slug)
    
    if market_data.description is not None:
        market.description = market_data.description
    
    if market_data.rules is not None:
        market.rules = market_data.rules
    
    if market_data.image_url is not None:
        market.image_url = market_data.image_url
    
    if market_data.category is not None:
        market.category = market_data.category
    
    if market_data.status is not None:
        market.status = market_data.status
    
    if market_data.meta_data is not None:
        market.meta_data = market_data.meta_data
    
    if market_data.max_points_per_user is not None:
        market.max_points_per_user = market_data.max_points_per_user
    
    db.commit()
    db.refresh(market)
    
    # Return updated market
    market_dict = {
        "id": market.id,
        "title": market.title,
        "slug": market.slug,
        "description": market.description,
        "rules": market.rules,
        "image_url": market.image_url,
        "category": market.category,
        "meta_data": market.meta_data or {},
        "max_points_per_user": market.max_points_per_user,
        "status": market.status,
        "resolution_outcome": market.resolution_outcome,
        "resolution_time": market.resolution_time,
        "created_by": market.created_by,
        "created_at": market.created_at,
        "updated_at": market.updated_at,
        "outcomes": [
            {
                "id": outcome.id,
                "market_id": outcome.market_id,
                "name": outcome.name,
                "total_points": outcome.total_points,
                "created_at": outcome.created_at,
            }
            for outcome in market.outcomes
        ],
    }
    
    return {
        "success": True,
        "data": {
            "market": MarketResponse(**market_dict),
        },
        "message": "Market updated successfully",
    }


@router.post("/upload-image", response_model=dict)
async def upload_market_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
):
    """Upload market image (admin only)"""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 10MB limit. Current size: {file_size / 1024 / 1024:.2f}MB",
        )
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid_module.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Return full URL (in production, this would be a CDN URL)
    # For development, construct URL from request
    base_url = str(request.base_url).rstrip('/')
    image_url = f"{base_url}/uploads/markets/{unique_filename}"
    
    return {
        "success": True,
        "data": {
            "image_url": image_url,
            "filename": unique_filename,
        },
        "message": "Image uploaded successfully",
    }
