"""Dashboard and Widget service — tenant-scoped CRUD."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.dashboard import Dashboard, Widget
from app.services.base_service import BaseTenantService


class DashboardService(BaseTenantService[Dashboard]):
    """CRUD for dashboards, scoped by tenant_id."""

    def __init__(self, db: Session, tenant_id: uuid.UUID):
        super().__init__(Dashboard, db, tenant_id)

    def list_by_workspace(
        self, workspace_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> list[Dashboard]:
        """List dashboards for a workspace, filtered by tenant_id."""
        return (
            self._base_query()
            .filter(Dashboard.workspace_id == workspace_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_with_widgets(self, dashboard_id: uuid.UUID) -> Dashboard:
        """Get a dashboard by ID with its widgets loaded (eager via relationship)."""
        dashboard = self.get_by_id(dashboard_id)
        # Force load widgets (relationship already filtered by cascade from dashboard)
        _ = dashboard.widgets
        return dashboard

    def create_widget(self, dashboard_id: uuid.UUID, **kwargs) -> Widget:
        """Create a widget on a dashboard, verifying tenant ownership."""
        # Verify dashboard belongs to this tenant
        self.get_by_id(dashboard_id)

        widget = Widget(
            tenant_id=self.tenant_id,
            dashboard_id=dashboard_id,
            **kwargs,
        )
        self.db.add(widget)
        self.db.commit()
        self.db.refresh(widget)
        return widget

    def update_widget(self, dashboard_id: uuid.UUID, widget_id: uuid.UUID, **kwargs) -> Widget:
        """Update a widget, verifying both dashboard and widget belong to tenant."""
        # Verify dashboard belongs to this tenant
        self.get_by_id(dashboard_id)

        widget = (
            self.db.query(Widget)
            .filter(
                Widget.id == widget_id,
                Widget.dashboard_id == dashboard_id,
                Widget.tenant_id == self.tenant_id,
            )
            .first()
        )
        if not widget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Widget not found",
            )

        for key, value in kwargs.items():
            setattr(widget, key, value)
        self.db.commit()
        self.db.refresh(widget)
        return widget

    def delete_widget(self, dashboard_id: uuid.UUID, widget_id: uuid.UUID) -> Widget:
        """Delete a widget, verifying both dashboard and widget belong to tenant."""
        # Verify dashboard belongs to this tenant
        self.get_by_id(dashboard_id)

        widget = (
            self.db.query(Widget)
            .filter(
                Widget.id == widget_id,
                Widget.dashboard_id == dashboard_id,
                Widget.tenant_id == self.tenant_id,
            )
            .first()
        )
        if not widget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Widget not found",
            )

        self.db.delete(widget)
        self.db.commit()
        return widget
