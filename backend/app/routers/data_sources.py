"""Data sources router — CSV upload and management endpoints."""

import uuid

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.data_source import DataSource
from app.models.user import User
from app.schemas.data_source import DataSourceListResponse, DataSourcePreviewResponse, DataSourceResponse
from app.services.base_service import BaseTenantService
from app.services.csv_service import delete_csv_files, get_csv_preview, upload_csv

router = APIRouter()


@router.post("/upload", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
def upload_csv_file(
    file: UploadFile = File(...),
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV file and create a data source."""
    return upload_csv(file, name, current_user.tenant_id, db)


@router.get("/", response_model=list[DataSourceListResponse])
def list_data_sources(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all data sources for the current tenant."""
    service = BaseTenantService(DataSource, db, current_user.tenant_id)
    sources = service.get_all(skip=skip, limit=limit)
    result = []
    for ds in sources:
        row_count = None
        column_count = None
        if ds.schema_cache:
            row_count = ds.schema_cache.get("row_count")
            columns = ds.schema_cache.get("columns", [])
            column_count = len(columns)
        result.append(DataSourceListResponse(
            id=ds.id,
            type=ds.type,
            name=ds.name,
            row_count=row_count,
            column_count=column_count,
            created_at=ds.created_at,
        ))
    return result


@router.get("/{data_source_id}/preview", response_model=DataSourcePreviewResponse)
def preview_data_source(
    data_source_id: uuid.UUID,
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(default=50, ge=1, le=1000, description="Rows per page (max 1000)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a paginated preview of the CSV data source."""
    service = BaseTenantService(DataSource, db, current_user.tenant_id)
    data_source = service.get_by_id(data_source_id)
    return get_csv_preview(data_source, page, page_size)


@router.get("/{data_source_id}", response_model=DataSourceResponse)
def get_data_source(
    data_source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a data source by ID."""
    service = BaseTenantService(DataSource, db, current_user.tenant_id)
    return service.get_by_id(data_source_id)


@router.delete("/{data_source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_source(
    data_source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a data source and its uploaded files."""
    service = BaseTenantService(DataSource, db, current_user.tenant_id)
    data_source = service.get_by_id(data_source_id)
    delete_csv_files(data_source)
    service.delete(data_source_id)
