"""Semantic layer router — CRUD endpoints for workspace semantic models."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.dashboard import SemanticLayer
from app.models.user import User
from app.schemas.semantic_layer import (
    SemanticLayerCreate,
    SemanticLayerListResponse,
    SemanticLayerResponse,
    SemanticLayerUpdate,
)
from app.services.base_service import BaseTenantService

router = APIRouter()


@router.post("/", response_model=SemanticLayerResponse, status_code=status.HTTP_201_CREATED)
def create_semantic_layer(
    data: SemanticLayerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new semantic layer for a workspace."""
    service = BaseTenantService(SemanticLayer, db, current_user.tenant_id)
    return service.create(
        workspace_id=data.workspace_id,
        name=data.name,
        definitions_json=data.definitions_json,
    )


@router.get("/", response_model=list[SemanticLayerListResponse])
def list_semantic_layers(
    workspace_id: uuid.UUID = Query(..., description="Filter by workspace ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all semantic layers for a workspace."""
    service = BaseTenantService(SemanticLayer, db, current_user.tenant_id)
    # Add workspace_id filter on top of tenant filter
    layers = (
        service._base_query()
        .filter(SemanticLayer.workspace_id == workspace_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return layers


@router.get("/{semantic_layer_id}", response_model=SemanticLayerResponse)
def get_semantic_layer(
    semantic_layer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a semantic layer by ID."""
    service = BaseTenantService(SemanticLayer, db, current_user.tenant_id)
    return service.get_by_id(semantic_layer_id)


@router.put("/{semantic_layer_id}", response_model=SemanticLayerResponse)
def update_semantic_layer(
    semantic_layer_id: uuid.UUID,
    data: SemanticLayerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a semantic layer (name and/or definitions_json)."""
    service = BaseTenantService(SemanticLayer, db, current_user.tenant_id)
    # Only update fields that are provided
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.definitions_json is not None:
        update_data["definitions_json"] = data.definitions_json
    return service.update(semantic_layer_id, **update_data)


@router.delete("/{semantic_layer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_semantic_layer(
    semantic_layer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a semantic layer."""
    service = BaseTenantService(SemanticLayer, db, current_user.tenant_id)
    service.delete(semantic_layer_id)
