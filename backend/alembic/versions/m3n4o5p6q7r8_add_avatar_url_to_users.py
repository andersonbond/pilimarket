"""add_avatar_url_to_users

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-01-08 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'm3n4o5p6q7r8'
down_revision = 'k1l2m3n4o5p6'  # Changed from l2m3n4o5p6q7 (which was deleted)
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add avatar_url column to users table
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove avatar_url column from users table
    op.drop_column('users', 'avatar_url')
