"""update dashboard and widget fields

Revision ID: 004
Revises: 003
Create Date: 2026-02-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Dashboard: add description, theme, updated_at ---
    op.add_column("dashboards", sa.Column("description", sa.String(500), nullable=True))
    op.add_column(
        "dashboards",
        sa.Column("theme", sa.String(50), nullable=False, server_default="classic"),
    )
    op.add_column("dashboards", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    # --- Widget: add tenant_id, type, title, saved_query_id, config_json, created_at, updated_at ---
    op.add_column(
        "widgets",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column("widgets", sa.Column("type", sa.String(50), nullable=True))
    op.add_column("widgets", sa.Column("title", sa.String(255), nullable=True))
    op.add_column(
        "widgets",
        sa.Column("saved_query_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "widgets",
        sa.Column("config_json", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "widgets",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )
    op.add_column("widgets", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    # Backfill existing widgets with defaults
    op.execute(
        """
        UPDATE widgets SET
            tenant_id = d.tenant_id,
            type = 'chart',
            title = 'Untitled',
            created_at = NOW()
        FROM dashboards d
        WHERE widgets.dashboard_id = d.id
          AND widgets.tenant_id IS NULL
        """
    )

    # Now set NOT NULL on required columns
    op.alter_column("widgets", "tenant_id", nullable=False)
    op.alter_column("widgets", "type", nullable=False)
    op.alter_column("widgets", "title", nullable=False)

    # Indexes and FKs
    op.create_index("ix_widgets_tenant_id", "widgets", ["tenant_id"])
    op.create_foreign_key(
        "fk_widgets_saved_query_id",
        "widgets",
        "saved_queries",
        ["saved_query_id"],
        ["id"],
    )

    # Update existing FK to add ON DELETE CASCADE
    op.drop_constraint("fk_widgets_dashboard_id", "widgets", type_="foreignkey")
    op.create_foreign_key(
        "fk_widgets_dashboard_id",
        "widgets",
        "dashboards",
        ["dashboard_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    # Restore original FK (without CASCADE)
    op.drop_constraint("fk_widgets_dashboard_id", "widgets", type_="foreignkey")
    op.create_foreign_key(
        "fk_widgets_dashboard_id",
        "widgets",
        "dashboards",
        ["dashboard_id"],
        ["id"],
    )

    op.drop_constraint("fk_widgets_saved_query_id", "widgets", type_="foreignkey")
    op.drop_index("ix_widgets_tenant_id", "widgets")

    op.drop_column("widgets", "updated_at")
    op.drop_column("widgets", "created_at")
    op.drop_column("widgets", "config_json")
    op.drop_column("widgets", "saved_query_id")
    op.drop_column("widgets", "title")
    op.drop_column("widgets", "type")
    op.drop_column("widgets", "tenant_id")

    op.drop_column("dashboards", "updated_at")
    op.drop_column("dashboards", "theme")
    op.drop_column("dashboards", "description")
