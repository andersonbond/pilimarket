"""
Notification model
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

from app.database import Base


class Notification(Base):
    """Notification model - in-app notifications for users"""
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # market_resolved, badge_earned, new_market, forecast_reminder
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    meta_data = Column(JSONB, nullable=True, default=dict)  # Flexible data storage (renamed from metadata - SQLAlchemy reserved)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", backref="notifications")
    
    # Optimized indexes for performance
    __table_args__ = (
        # Critical: Unread notifications query (most common)
        Index('idx_notifications_user_unread', 'user_id', 'read', 'created_at', postgresql_ops={'created_at': 'DESC'}, postgresql_where=(read == False)),
        # All notifications for user
        Index('idx_notifications_user_all', 'user_id', 'created_at', postgresql_ops={'created_at': 'DESC'}),
        # Type filtering
        Index('idx_notifications_type', 'type'),
    )

