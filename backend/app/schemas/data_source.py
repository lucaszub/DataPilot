"""Pydantic schemas for data source endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class ColumnSchema(BaseModel):
    name: str
    type: str


class SchemaInfo(BaseModel):
    columns: list[ColumnSchema]
    row_count: int
    sample_rows: list[dict] = []


class DataSourceResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    type: str
    name: str
    schema_cache: SchemaInfo | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DataSourceListResponse(BaseModel):
    id: uuid.UUID
    type: str
    name: str
    row_count: int | None = None
    column_count: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DataSourcePreviewResponse(BaseModel):
    columns: list[ColumnSchema]
    rows: list[dict]
    total_rows: int
    page: int
    page_size: int
    total_pages: int
