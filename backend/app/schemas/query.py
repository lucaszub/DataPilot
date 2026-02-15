"""Pydantic schemas for query execution and saved queries."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class QueryExecuteRequest(BaseModel):
    """Request schema for executing a SQL query."""
    sql_text: str = Field(..., min_length=1, description="SQL query to execute")
    workspace_id: uuid.UUID = Field(..., description="Workspace containing the semantic layer")
    limit: int = Field(default=10000, ge=1, le=50000, description="Max rows to return")


class ColumnInfo(BaseModel):
    name: str
    type: str


class QueryExecuteResponse(BaseModel):
    """Response schema for query execution results."""
    columns: list[ColumnInfo]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float


class SavedQueryCreate(BaseModel):
    """Request schema for creating a saved query."""
    name: str = Field(..., min_length=1, max_length=255)
    sql_text: str = Field(..., min_length=1)
    workspace_id: uuid.UUID
    chart_type: str | None = Field(default=None, pattern=r"^(bar|line|pie|kpi|table|area)$")


class SavedQueryUpdate(BaseModel):
    """Request schema for updating a saved query."""
    name: str | None = Field(default=None, min_length=1, max_length=255)
    sql_text: str | None = Field(default=None, min_length=1)
    chart_type: str | None = Field(default=None, pattern=r"^(bar|line|pie|kpi|table|area)$")


class SavedQueryResponse(BaseModel):
    """Response schema for a saved query."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    sql_text: str
    chart_type: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
