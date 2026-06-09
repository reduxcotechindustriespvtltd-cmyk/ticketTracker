"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-06

"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "amadeus_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("office_id", sa.String(100), nullable=False),
        sa.Column("wsap_user_encrypted", sa.String(512), nullable=False),
        sa.Column("wsap_pass_encrypted", sa.String(512), nullable=False),
        sa.Column("totp_secret_encrypted", sa.String(512), nullable=True),
        sa.Column("portal_type", sa.Enum("web", "terminal", name="portaltype"), nullable=False, server_default="web"),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "tickets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("ticket_number", sa.String(13), nullable=False),
        sa.Column("pnr_locator", sa.String(20), nullable=True),
        sa.Column("passenger_name", sa.String(255), nullable=True),
        sa.Column("route", sa.String(255), nullable=True),
        sa.Column("origin", sa.String(3), nullable=True),
        sa.Column("destination", sa.String(3), nullable=True),
        sa.Column("carrier_code", sa.String(2), nullable=True),
        sa.Column("departure_date", sa.Date(), nullable=True),
        sa.Column("issue_date", sa.Date(), nullable=True),
        sa.Column("coupon_status", sa.Enum("O", "NS", "F", "V", "R", "E", "A", name="couponstatus"), nullable=True),
        sa.Column("tag", sa.Enum("no_show", "cancelled_before_dep", "used", "refunded", "active", "retry_48hrs", "manual_check", name="tickettag"), nullable=True),
        sa.Column("fare_basis_code", sa.String(50), nullable=True),
        sa.Column("base_fare", sa.Numeric(12, 2), nullable=True),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("total_fare", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=True),
        sa.Column("cancellation_penalty", sa.Numeric(12, 2), nullable=True),
        sa.Column("net_refund_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("pnr_cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("categorised_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tickets_ticket_number", "tickets", ["ticket_number"])
    op.create_index("ix_tickets_tenant_id", "tickets", ["tenant_id"])

    op.create_table(
        "refund_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("carrier_code", sa.String(2), nullable=False),
        sa.Column("fare_type", sa.String(50), nullable=True),
        sa.Column("refund_window_days", sa.Integer(), nullable=True),
        sa.Column("noshow_window_days", sa.Integer(), nullable=True),
        sa.Column("penalty_type", sa.Enum("flat", "percentage", name="penaltytype"), nullable=False),
        sa.Column("penalty_value", sa.Numeric(12, 2), nullable=False),
    )
    op.create_index("ix_refund_rules_carrier_code", "refund_rules", ["carrier_code"])

    op.create_table(
        "sync_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("tickets_fetched", sa.Integer(), server_default="0"),
        sa.Column("tickets_flagged", sa.Integer(), server_default="0"),
        sa.Column("errors", sa.Text(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
    )

    op.create_table(
        "audit_trail",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ticket_id", sa.Integer(), sa.ForeignKey("tickets.id"), nullable=False),
        sa.Column("command_used", sa.String(255), nullable=False),
        sa.Column("raw_response", sa.Text(), nullable=True),
        sa.Column("parsed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_audit_trail_ticket_id", "audit_trail", ["ticket_id"])


def downgrade() -> None:
    op.drop_table("audit_trail")
    op.drop_table("sync_logs")
    op.drop_table("refund_rules")
    op.drop_table("tickets")
    op.drop_table("amadeus_config")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS portaltype")
    op.execute("DROP TYPE IF EXISTS couponstatus")
    op.execute("DROP TYPE IF EXISTS tickettag")
    op.execute("DROP TYPE IF EXISTS penaltytype")
