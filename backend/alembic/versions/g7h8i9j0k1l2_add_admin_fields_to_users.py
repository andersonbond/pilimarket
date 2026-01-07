"""add_admin_fields_to_users

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g7h8i9j0k1l2'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_banned column
    op.add_column('users', sa.Column('is_banned', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index(op.f('ix_users_is_banned'), 'users', ['is_banned'], unique=False)
    
    # Add chips_frozen column
    op.add_column('users', sa.Column('chips_frozen', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index(op.f('ix_users_chips_frozen'), 'users', ['chips_frozen'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_chips_frozen'), table_name='users')
    op.drop_column('users', 'chips_frozen')
    op.drop_index(op.f('ix_users_is_banned'), table_name='users')
    op.drop_column('users', 'is_banned')

