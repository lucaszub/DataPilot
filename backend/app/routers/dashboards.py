"""Dashboards router — CRUD for dashboards and widgets."""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardCreate,
    DashboardResponse,
    DashboardUpdate,
    DashboardWithWidgets,
    WidgetCreate,
    WidgetResponse,
    WidgetUpdate,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()


# --- Dashboard CRUD ---


@router.get("/", response_model=list[DashboardResponse])
def list_dashboards(
    workspace_id: uuid.UUID = Query(..., description="Filter by workspace ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    return service.list_by_workspace(workspace_id, skip=skip, limit=limit)


@router.post("/", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
def create_dashboard(
    data: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    return service.create(
        workspace_id=data.workspace_id,
        name=data.name,
        description=data.description,
        theme=data.theme,
        layout_json=data.layout_json,
    )


@router.get("/{dashboard_id}", response_model=DashboardWithWidgets)
def get_dashboard(
    dashboard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    return service.get_with_widgets(dashboard_id)


@router.put("/{dashboard_id}", response_model=DashboardResponse)
def update_dashboard(
    dashboard_id: uuid.UUID,
    data: DashboardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.theme is not None:
        update_data["theme"] = data.theme
    if data.layout_json is not None:
        update_data["layout_json"] = data.layout_json
    return service.update(dashboard_id, **update_data)


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dashboard(
    dashboard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    service.delete(dashboard_id)


# --- Widget CRUD ---


@router.post(
    "/{dashboard_id}/widgets",
    response_model=WidgetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_widget(
    dashboard_id: uuid.UUID,
    data: WidgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    return service.create_widget(
        dashboard_id=dashboard_id,
        type=data.type,
        title=data.title,
        saved_query_id=data.saved_query_id,
        config_json=data.config_json,
        query_json=data.query_json,
        chart_type=data.chart_type,
        position=data.position,
    )


@router.put(
    "/{dashboard_id}/widgets/{widget_id}",
    response_model=WidgetResponse,
)
def update_widget(
    dashboard_id: uuid.UUID,
    widget_id: uuid.UUID,
    data: WidgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    update_data = {}
    if data.type is not None:
        update_data["type"] = data.type
    if data.title is not None:
        update_data["title"] = data.title
    if data.saved_query_id is not None:
        update_data["saved_query_id"] = data.saved_query_id
    if data.config_json is not None:
        update_data["config_json"] = data.config_json
    if data.query_json is not None:
        update_data["query_json"] = data.query_json
    if data.chart_type is not None:
        update_data["chart_type"] = data.chart_type
    if data.position is not None:
        update_data["position"] = data.position
    return service.update_widget(dashboard_id, widget_id, **update_data)


@router.delete(
    "/{dashboard_id}/widgets/{widget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_widget(
    dashboard_id: uuid.UUID,
    widget_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DashboardService(db, current_user.tenant_id)
    service.delete_widget(dashboard_id, widget_id)
