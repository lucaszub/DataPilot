"""Pydantic schemas for workspace endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkspaceCreate(BaseModel):
    """Request schema for creating a workspace."""
    name: str
    settings: dict | None = None


class WorkspaceResponse(BaseModel):
    """Response schema for a workspace object."""
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    settings: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
