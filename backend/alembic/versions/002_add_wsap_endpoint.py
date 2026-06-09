"""add wsap_endpoint column, drop portal_type

Revision ID: 002
Revises: 001
Create Date: 2026-06-07
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "amadeus_config",
        sa.Column("wsap_endpoint", sa.String(512), nullable=True),
    )
    # portal_type is no longer used — drop it
    op.drop_column("amadeus_config", "portal_type")


def downgrade() -> None:
    op.add_column(
        "amadeus_config",
        sa.Column(
            "portal_type",
            sa.Enum("web", "terminal", name="portaltype"),
            nullable=False,
            server_default="web",
        ),
    )
    op.drop_column("amadeus_config", "wsap_endpoint")
