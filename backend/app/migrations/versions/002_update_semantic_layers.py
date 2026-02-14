"""update semantic_layers add tenant_id workspace_id name

Revision ID: 002
Revises: 001
Create Date: 2026-02-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old FK constraint
    op.drop_constraint("fk_semantic_layers_data_source_id", "semantic_layers", type_="foreignkey")

    # Drop data_source_id column
    op.drop_column("semantic_layers", "data_source_id")

    # Add new columns
    op.add_column("semantic_layers", sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False))
    op.add_column("semantic_layers", sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False))
    op.add_column("semantic_layers", sa.Column("name", sa.String(255), nullable=False))
    op.add_column(
        "semantic_layers",
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.add_column("semantic_layers", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    # Add FK to workspaces
    op.create_foreign_key(
        "fk_semantic_layers_workspace_id", "semantic_layers", "workspaces", ["workspace_id"], ["id"]
    )

    # Add index on tenant_id
    op.create_index("ix_semantic_layers_tenant_id", "semantic_layers", ["tenant_id"])


def downgrade() -> None:
    # Drop index
    op.drop_index("ix_semantic_layers_tenant_id", "semantic_layers")

    # Drop FK to workspaces
    op.drop_constraint("fk_semantic_layers_workspace_id", "semantic_layers", type_="foreignkey")

    # Drop new columns
    op.drop_column("semantic_layers", "updated_at")
    op.drop_column("semantic_layers", "created_at")
    op.drop_column("semantic_layers", "name")
    op.drop_column("semantic_layers", "workspace_id")
    op.drop_column("semantic_layers", "tenant_id")

    # Re-add data_source_id column
    op.add_column("semantic_layers", sa.Column("data_source_id", postgresql.UUID(as_uuid=True), nullable=False))

    # Re-add old FK constraint
    op.create_foreign_key(
        "fk_semantic_layers_data_source_id", "semantic_layers", "data_sources", ["data_source_id"], ["id"]
    )
