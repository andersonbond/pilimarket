"""
Market model
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class Market(Base):
    """Market model"""
    __tablename__ = "markets"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    rules = Column(Text, nullable=True)  # Resolution rules/criteria
    image_url = Column(String, nullable=True)  # Market image URL
    category = Column(String, nullable=False, index=True)  # election, politics, sports, entertainment, economy, weather, other
    meta_data = Column(JSON, nullable=True, default=dict)  # Additional data as JSON (renamed from metadata to avoid SQLAlchemy reserved word)
    
    # Status: open, suspended, resolved, cancelled
    status = Column(String, default="open", nullable=False, index=True)
    resolution_outcome = Column(String, nullable=True)  # ID of winning outcome
    resolution_time = Column(DateTime(timezone=True), nullable=True)
    
    # Limits
    max_points_per_user = Column(Integer, default=10000, nullable=False)
    
    # Relationships
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    outcomes = relationship("Outcome", back_populates="market", cascade="all, delete-orphan")


class Outcome(Base):
    """Outcome model"""
    __tablename__ = "outcomes"

    id = Column(String, primary_key=True, index=True)
    market_id = Column(String, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)  # "Yes", "No", etc.
    total_points = Column(Integer, default=0, nullable=False)  # Total chips/points allocated to this outcome
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    market = relationship("Market", back_populates="outcomes")
    
    # Unique constraint: one outcome name per market
    __table_args__ = (
        UniqueConstraint('market_id', 'name', name='uq_outcome_market_name'),
    )

