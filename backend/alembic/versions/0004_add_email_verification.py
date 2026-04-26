"""Add email verification fields to users

Revision ID: 0004
Revises: 0003
Create Date: 2024-01-04 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("verification_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("verification_token_expires", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "verification_token_expires")
    op.drop_column("users", "verification_token")
    op.drop_column("users", "is_verified")