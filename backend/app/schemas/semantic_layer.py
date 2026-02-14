"""Pydantic schemas for semantic layer endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SemanticLayerCreate(BaseModel):
    """Request schema for creating a semantic layer."""
    workspace_id: uuid.UUID
    name: str
    definitions_json: dict | None = None


class SemanticLayerUpdate(BaseModel):
    """Request schema for updating a semantic layer."""
    name: str | None = None
    definitions_json: dict | None = None


class SemanticLayerResponse(BaseModel):
    """Response schema for a full semantic layer object."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    definitions_json: dict | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class SemanticLayerListResponse(BaseModel):
    """Response schema for semantic layer list items."""
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
