"""Workspaces router — minimal CRUD for workspaces."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse
from app.services.base_service import BaseTenantService

router = APIRouter()


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new workspace."""
    service = BaseTenantService(Workspace, db, current_user.tenant_id)
    return service.create(name=data.name, settings=data.settings)


@router.get("/", response_model=list[WorkspaceResponse])
def list_workspaces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all workspaces for the current tenant."""
    service = BaseTenantService(Workspace, db, current_user.tenant_id)
    return service.get_all(skip=skip, limit=limit)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a workspace by ID."""
    service = BaseTenantService(Workspace, db, current_user.tenant_id)
    return service.get_by_id(workspace_id)
