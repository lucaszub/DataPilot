"""Pydantic schemas for AI text-to-SQL."""

import uuid
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.query import ColumnInfo


class AIQueryRequest(BaseModel):
    """Request schema for AI text-to-SQL query."""

    question: str = Field(
        ..., min_length=3, max_length=2000, description="Natural language question"
    )
    workspace_id: uuid.UUID = Field(
        ..., description="Workspace containing the semantic layer"
    )


class AIGeneratedSQL(BaseModel):
    """Response from Claude API after SQL generation."""

    sql: str
    explanation: str
    suggested_chart: str | None = None


class AIQueryResults(BaseModel):
    """Query execution results subset."""

    columns: list[ColumnInfo]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float


class AIQueryResponse(BaseModel):
    """Full response for AI text-to-SQL query."""

    sql: str
    explanation: str
    results: AIQueryResults
    suggested_chart: str | None = None
