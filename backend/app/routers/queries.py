"""Queries router — SQL execution and saved query CRUD."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.dashboard import SemanticLayer
from app.models.saved_query import SavedQuery
from app.models.user import User
from app.schemas.query import (
    QueryExecuteRequest,
    QueryExecuteResponse,
    SavedQueryCreate,
    SavedQueryResponse,
    SavedQueryUpdate,
)
from app.services.base_service import BaseTenantService
from app.services.query_service import SemanticQueryBuilder

router = APIRouter()


@router.post("/execute", response_model=QueryExecuteResponse)
def execute_query(
    data: QueryExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute a SQL query against the workspace's semantic layer."""
    tenant_id = current_user.tenant_id

    # Find the semantic layer for this workspace
    semantic_layer = (
        db.query(SemanticLayer)
        .filter(
            SemanticLayer.workspace_id == data.workspace_id,
            SemanticLayer.tenant_id == tenant_id,
        )
        .first()
    )
    if not semantic_layer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No semantic layer found for this workspace",
        )

    if not semantic_layer.definitions_json:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Semantic layer has no definitions configured",
        )

    builder = SemanticQueryBuilder()
    try:
        builder.setup_context(
            definitions_json=semantic_layer.definitions_json,
            tenant_id=tenant_id,
            db=db,
        )
        result = builder.execute_query(
            sql_text=data.sql_text,
            limit=data.limit,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    finally:
        builder.close()


# --- Saved queries CRUD ---


@router.post("/saved", response_model=SavedQueryResponse, status_code=status.HTTP_201_CREATED)
def create_saved_query(
    data: SavedQueryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a query for later reuse."""
    service = BaseTenantService(SavedQuery, db, current_user.tenant_id)
    return service.create(
        workspace_id=data.workspace_id,
        name=data.name,
        sql_text=data.sql_text,
        chart_type=data.chart_type,
    )


@router.get("/saved", response_model=list[SavedQueryResponse])
def list_saved_queries(
    workspace_id: uuid.UUID = Query(..., description="Filter by workspace ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List saved queries for a workspace."""
    service = BaseTenantService(SavedQuery, db, current_user.tenant_id)
    return (
        service._base_query()
        .filter(SavedQuery.workspace_id == workspace_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/saved/{query_id}", response_model=SavedQueryResponse)
def get_saved_query(
    query_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a saved query by ID."""
    service = BaseTenantService(SavedQuery, db, current_user.tenant_id)
    return service.get_by_id(query_id)


@router.put("/saved/{query_id}", response_model=SavedQueryResponse)
def update_saved_query(
    query_id: uuid.UUID,
    data: SavedQueryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a saved query."""
    service = BaseTenantService(SavedQuery, db, current_user.tenant_id)
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.sql_text is not None:
        update_data["sql_text"] = data.sql_text
    if data.chart_type is not None:
        update_data["chart_type"] = data.chart_type
    return service.update(query_id, **update_data)


@router.delete("/saved/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_query(
    query_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a saved query."""
    service = BaseTenantService(SavedQuery, db, current_user.tenant_id)
    service.delete(query_id)
