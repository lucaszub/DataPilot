"""CSV upload service — handles file storage and parquet conversion via DuckDB."""

import datetime
import decimal
import json
import os
import shutil
import uuid
from pathlib import Path

import duckdb
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.data_source import DataSource


def _json_safe(val: object) -> object:
    """Convert non-JSON-serializable values (date, datetime, Decimal) to strings."""
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.isoformat()
    if isinstance(val, decimal.Decimal):
        return float(val)
    return val


def _get_upload_path(tenant_id: uuid.UUID, ds_id: uuid.UUID) -> Path:
    return Path(settings.upload_dir) / str(tenant_id) / str(ds_id)


def _validate_csv_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .csv files are accepted",
        )
    if file.content_type and file.content_type not in (
        "text/csv",
        "application/vnd.ms-excel",
        "application/octet-stream",
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type: {file.content_type}",
        )


def _save_uploaded_file(file: UploadFile, dest: Path) -> int:
    """Save uploaded file to disk and return file size in bytes."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    size = 0
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    with open(dest, "wb") as f:
        while chunk := file.file.read(8192):
            size += len(chunk)
            if size > max_bytes:
                f.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds {settings.max_upload_size_mb}MB limit",
                )
            f.write(chunk)
    if size == 0:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )
    return size


def _convert_to_parquet(csv_path: Path, parquet_path: Path) -> None:
    """Convert CSV to Parquet using DuckDB."""
    conn = duckdb.connect()
    try:
        csv_str = str(csv_path).replace("'", "''")
        parquet_str = str(parquet_path).replace("'", "''")
        conn.execute(
            f"COPY (SELECT * FROM read_csv_auto('{csv_str}')) TO '{parquet_str}' (FORMAT PARQUET)"
        )
    except duckdb.Error as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse CSV: {str(e)}",
        )
    finally:
        conn.close()


def _infer_schema(csv_path: Path) -> dict:
    """Infer column names, types, row count, and sample rows from CSV via DuckDB."""
    conn = duckdb.connect()
    try:
        rel = conn.read_csv(str(csv_path))
        columns = []
        for name, dtype in zip(rel.columns, rel.dtypes):
            columns.append({"name": name, "type": str(dtype)})
        row_count = rel.count("*").fetchone()[0]
        sample_rows = rel.limit(100).fetchall()
        sample = [
            {col: _json_safe(val) for col, val in zip(rel.columns, row)}
            for row in sample_rows
        ]
        return {
            "columns": columns,
            "row_count": row_count,
            "sample_rows": sample,
        }
    except duckdb.Error as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to infer schema: {str(e)}",
        )
    finally:
        conn.close()


def upload_csv(
    file: UploadFile,
    name: str,
    tenant_id: uuid.UUID,
    db: Session,
) -> DataSource:
    """Upload a CSV file, convert to parquet, infer schema, and create a DataSource record."""
    _validate_csv_file(file)

    ds_id = uuid.uuid4()
    upload_path = _get_upload_path(tenant_id, ds_id)
    csv_path = upload_path / "original.csv"
    parquet_path = upload_path / "processed.parquet"

    try:
        file_size = _save_uploaded_file(file, csv_path)
        _convert_to_parquet(csv_path, parquet_path)
        schema_info = _infer_schema(csv_path)
    except HTTPException:
        shutil.rmtree(upload_path, ignore_errors=True)
        raise
    except Exception:
        shutil.rmtree(upload_path, ignore_errors=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during CSV processing",
        )

    connection_config = json.dumps({
        "storage_path": str(upload_path),
        "original_filename": file.filename,
        "file_size_bytes": file_size,
    })

    data_source = DataSource(
        id=ds_id,
        tenant_id=tenant_id,
        type="csv",
        name=name,
        connection_config_encrypted=connection_config,
        schema_cache=schema_info,
    )
    db.add(data_source)
    db.commit()
    db.refresh(data_source)
    return data_source


def get_csv_preview(
    data_source: DataSource,
    page: int,
    page_size: int,
) -> dict:
    """Return a paginated preview of a CSV data source via DuckDB reading the parquet file.

    Args:
        data_source: The DataSource ORM instance (must be of type 'csv').
        page: 1-based page number.
        page_size: Number of rows per page (1–1000).

    Returns:
        A dict with keys: columns, rows, total_rows, page, page_size, total_pages.

    Raises:
        HTTPException 422: Parquet file is missing.
        HTTPException 500: Unexpected DuckDB error.
    """
    if not data_source.connection_config_encrypted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Data source has no associated file",
        )
    config = json.loads(data_source.connection_config_encrypted)
    storage_path = config.get("storage_path")
    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Data source storage path is missing",
        )
    parquet_path = Path(storage_path) / "processed.parquet"
    if not parquet_path.exists():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Parquet file not found — data source may be corrupted",
        )

    conn = duckdb.connect()
    try:
        parquet_str = str(parquet_path).replace("'", "''")

        # Total row count
        total_rows: int = conn.execute(
            f"SELECT COUNT(*) FROM read_parquet('{parquet_str}')"
        ).fetchone()[0]

        total_pages = max(1, -(-total_rows // page_size))  # ceiling division

        offset = (page - 1) * page_size
        rel = conn.execute(
            f"SELECT * FROM read_parquet('{parquet_str}') LIMIT {page_size} OFFSET {offset}"
        )
        col_names = [desc[0] for desc in rel.description]
        raw_rows = rel.fetchall()
        rows = [
            {col: _json_safe(val) for col, val in zip(col_names, row)}
            for row in raw_rows
        ]

        # Build column schema list from parquet metadata
        describe_rel = conn.execute(
            f"DESCRIBE SELECT * FROM read_parquet('{parquet_str}')"
        )
        columns = [
            {"name": r[0], "type": r[1]}
            for r in describe_rel.fetchall()
        ]

        return {
            "columns": columns,
            "rows": rows,
            "total_rows": total_rows,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    except HTTPException:
        raise
    except duckdb.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read parquet file: {str(e)}",
        )
    finally:
        conn.close()


def delete_csv_files(data_source: DataSource) -> None:
    """Remove uploaded CSV/parquet files from disk."""
    if data_source.connection_config_encrypted:
        config = json.loads(data_source.connection_config_encrypted)
        storage_path = config.get("storage_path")
        if storage_path:
            shutil.rmtree(storage_path, ignore_errors=True)
