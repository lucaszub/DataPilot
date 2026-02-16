"""Pydantic schemas for dashboard and widget endpoints."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# --- Widget schemas ---


class WidgetCreate(BaseModel):
    """Request schema for creating a widget."""
    type: str = Field(..., pattern=r"^(kpi|chart|table|text)$")
    title: str = Field(..., min_length=1, max_length=255)
    saved_query_id: uuid.UUID | None = None
    config_json: dict[str, Any] | None = None
    query_json: dict[str, Any] | None = None
    chart_type: str = Field(..., pattern=r"^(bar|line|pie|kpi|table|area)$")
    position: dict[str, Any] | None = None


class WidgetUpdate(BaseModel):
    """Request schema for updating a widget."""
    type: str | None = Field(default=None, pattern=r"^(kpi|chart|table|text)$")
    title: str | None = Field(default=None, min_length=1, max_length=255)
    saved_query_id: uuid.UUID | None = None
    config_json: dict[str, Any] | None = None
    query_json: dict[str, Any] | None = None
    chart_type: str | None = Field(default=None, pattern=r"^(bar|line|pie|kpi|table|area)$")
    position: dict[str, Any] | None = None


class WidgetResponse(BaseModel):
    """Response schema for a widget."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    dashboard_id: uuid.UUID
    type: str
    title: str
    saved_query_id: uuid.UUID | None
    config_json: dict[str, Any] | None
    query_json: dict[str, Any] | None
    chart_type: str
    position: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard schemas ---


class DashboardCreate(BaseModel):
    """Request schema for creating a dashboard."""
    workspace_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    theme: str = Field(default="classic", pattern=r"^(classic|dark|light|ocean|forest)$")
    layout_json: dict[str, Any] | None = None


class DashboardUpdate(BaseModel):
    """Request schema for updating a dashboard."""
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    theme: str | None = Field(default=None, pattern=r"^(classic|dark|light|ocean|forest)$")
    layout_json: dict[str, Any] | None = None


class DashboardResponse(BaseModel):
    """Response schema for a dashboard (without widgets)."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None
    theme: str
    layout_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class DashboardWithWidgets(DashboardResponse):
    """Response schema for a dashboard with its widgets."""
    widgets: list[WidgetResponse] = []
