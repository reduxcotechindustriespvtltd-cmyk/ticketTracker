"""Hardening: wsap_endpoint NOT NULL, unique ticket constraint, refund_deadline, is_urgent

Revision ID: 003
Revises: 002
Create Date: 2026-06-08
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. wsap_endpoint: set empty string for any NULL rows, then enforce NOT NULL
    op.execute("UPDATE amadeus_config SET wsap_endpoint = '' WHERE wsap_endpoint IS NULL")
    op.alter_column("amadeus_config", "wsap_endpoint", nullable=False)

    # 2. De-duplicate tickets (keep the row with the highest id per tenant+ticket_number)
    op.execute("""
        DELETE FROM tickets
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM tickets
            GROUP BY tenant_id, ticket_number
        )
    """)
    op.create_unique_constraint(
        "uq_tickets_tenant_ticket", "tickets", ["tenant_id", "ticket_number"]
    )

    # 3. Add refund_deadline — computed during sync; drives the "expiry" countdown
    op.add_column("tickets", sa.Column("refund_deadline", sa.Date(), nullable=True))

    # 4. Add is_urgent flag — set by the check_expiring_tickets beat task
    op.add_column(
        "tickets",
        sa.Column("is_urgent", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("tickets", "is_urgent")
    op.drop_column("tickets", "refund_deadline")
    op.drop_constraint("uq_tickets_tenant_ticket", "tickets", type_="unique")
    op.alter_column("amadeus_config", "wsap_endpoint", nullable=True)
