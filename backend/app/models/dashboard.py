import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Uuid, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Dashboard(Base):
    __tablename__ = "dashboards"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("workspaces.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    theme: Mapped[str] = mapped_column(String(50), nullable=False, server_default="classic")
    layout_json: Mapped[dict | None] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    widgets: Mapped[list["Widget"]] = relationship(
        "Widget", back_populates="dashboard", cascade="all, delete-orphan"
    )


class Widget(Base):
    __tablename__ = "widgets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    dashboard_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("dashboards.id", name="fk_widgets_dashboard_id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    saved_query_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("saved_queries.id", name="fk_widgets_saved_query_id"), nullable=True
    )
    config_json: Mapped[dict | None] = mapped_column(JSON, default=None)
    query_json: Mapped[dict | None] = mapped_column(JSON, default=None)
    chart_type: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[dict | None] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    dashboard: Mapped["Dashboard"] = relationship("Dashboard", back_populates="widgets")


class SemanticLayer(Base):
    __tablename__ = "semantic_layers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id", name="fk_semantic_layers_workspace_id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    definitions_json: Mapped[dict | None] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
