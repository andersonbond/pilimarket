"""
Activity model
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

from app.database import Base


class Activity(Base):
    """Activity model - tracks user and system activities"""
    __tablename__ = "activities"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    activity_type = Column(String, nullable=False, index=True)  # forecast_placed, market_resolved, badge_earned, market_created, user_registered
    market_id = Column(String, ForeignKey("markets.id", ondelete="SET NULL"), nullable=True, index=True)
    meta_data = Column(JSONB, nullable=True, default=dict)  # Flexible data storage (renamed from metadata - SQLAlchemy reserved)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", backref="activities")
    market = relationship("Market", backref="activities")
    
    # Optimized indexes for common queries
    __table_args__ = (
        Index('idx_activities_user_created', 'user_id', 'created_at', postgresql_ops={'created_at': 'DESC'}, postgresql_where=(user_id.isnot(None))),
        Index('idx_activities_global_created', 'created_at', postgresql_ops={'created_at': 'DESC'}, postgresql_where=(user_id.is_(None))),
        Index('idx_activities_market_created', 'market_id', 'created_at', postgresql_ops={'created_at': 'DESC'}, postgresql_where=(market_id.isnot(None))),
        Index('idx_activities_type_created', 'activity_type', 'created_at', postgresql_ops={'created_at': 'DESC'}),
    )

