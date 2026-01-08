"""add_market_moderator_to_users

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'h8i9j0k1l2m3'
down_revision = 'g7h8i9j0k1l2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_market_moderator column
    op.add_column('users', sa.Column('is_market_moderator', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index(op.f('ix_users_is_market_moderator'), 'users', ['is_market_moderator'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_is_market_moderator'), table_name='users')
    op.drop_column('users', 'is_market_moderator')

