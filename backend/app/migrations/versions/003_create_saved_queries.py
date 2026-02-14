"""create saved_queries table

Revision ID: 003
Revises: 002
Create Date: 2026-02-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "saved_queries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("sql_text", sa.Text(), nullable=False),
        sa.Column("chart_type", sa.String(50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index("ix_saved_queries_tenant_id", "saved_queries", ["tenant_id"])

    op.create_foreign_key(
        "fk_saved_queries_workspace_id",
        "saved_queries",
        "workspaces",
        ["workspace_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_saved_queries_workspace_id", "saved_queries", type_="foreignkey")
    op.drop_index("ix_saved_queries_tenant_id", "saved_queries")
    op.drop_table("saved_queries")
