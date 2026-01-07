"""
User model
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    contact_number = Column(String, nullable=False, index=True)  # Format: +63XXXXXXXXXX
    bio = Column(Text, nullable=True)
    
    # Virtual chips (non-redeemable)
    chips = Column(Integer, default=0, nullable=False)  # Starting chips (users must purchase)
    
    # Reputation system
    reputation = Column(Float, default=0.0, nullable=False)  # 0-100 scale
    rank_score = Column(Float, default=0.0, nullable=False)  # For leaderboard
    badges = Column(JSON, nullable=True, default=list)  # List of badge IDs (JSON array)
    
    # Streaks
    winning_streak = Column(Integer, default=0, nullable=False)  # Consecutive correct forecasts
    activity_streak = Column(Integer, default=0, nullable=False)  # Consecutive days with activity
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False, index=True)
    chips_frozen = Column(Boolean, default=False, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Password reset
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

