"""
Purchase model
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class Purchase(Base):
    """Purchase model"""
    __tablename__ = "purchases"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Purchase details
    amount_cents = Column(Integer, nullable=False)  # Amount in centavos (₱1.00 = 100 cents)
    chips_added = Column(Integer, nullable=False)  # Number of chips added (1 chip = ₱1.00)
    
    # Payment provider (for future use: 'stripe', 'gcash', 'paymaya')
    # For testing: 'test' provider
    provider = Column(String, default="test", nullable=False)  # 'test', 'stripe', 'gcash', 'paymaya'
    provider_tx_id = Column(String, nullable=True)  # Transaction ID from payment provider
    
    # Status: pending, completed, failed, refunded
    status = Column(String, default="pending", nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="purchases")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('amount_cents > 0', name='check_amount_positive'),
        CheckConstraint('chips_added > 0', name='check_chips_positive'),
        CheckConstraint("provider IN ('test', 'stripe', 'gcash', 'paymaya')", name='check_provider'),
        CheckConstraint("status IN ('pending', 'completed', 'failed', 'refunded')", name='check_status'),
    )

