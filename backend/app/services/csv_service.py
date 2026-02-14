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


def _detect_csv_format(csv_path: Path) -> dict[str, str]:
    """Detect CSV delimiter and decimal separator from the file header.

    If semicolons outnumber commas in the header line, the file likely uses
    European/French format (`;` delimiter, `,` decimal separator).
    """
    with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
        header = f.readline()
    if not header:
        return {}
    if header.count(";") > header.count(","):
        return {"delim": ";", "decimal_separator": ","}
    return {}


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


def _build_read_csv_sql(csv_str: str, fmt: dict[str, str]) -> str:
    """Build a read_csv_auto() SQL expression with optional format parameters.

    Only passes the delimiter, *not* decimal_separator — mixed decimal formats
    within the same file (e.g. French amount `-383,00` next to English balance
    `252.6`) would break DuckDB's global decimal_separator setting.
    """
    delim = fmt.get("delim")
    if delim:
        return f"read_csv_auto('{csv_str}', delim='{delim}')"
    return f"read_csv_auto('{csv_str}')"


def _fix_french_numbers(
    conn: duckdb.DuckDBPyConnection,
    table_name: str,
) -> str:
    """Build a SELECT that converts French-format VARCHAR numbers to DOUBLE.

    Detects VARCHAR columns that contain commas (`,`) in their values and where
    ≥80 % of non-empty values are castable to DOUBLE after replacing `,` → `.`
    and removing spaces (thousands separator).

    Returns a SQL SELECT expression ready for COPY … TO.
    """
    cols_info = conn.execute(f"DESCRIBE {table_name}").fetchall()
    select_parts: list[str] = []

    for col_name, col_type, *_ in cols_info:
        safe_col = f'"{col_name}"'
        if "VARCHAR" in col_type:
            row = conn.execute(f"""
                SELECT
                    COUNT(CASE WHEN {safe_col} IS NOT NULL AND {safe_col} != '' THEN 1 END),
                    COUNT(CASE WHEN {safe_col} LIKE '%,%' THEN 1 END),
                    COUNT(TRY_CAST(
                        REPLACE(REPLACE({safe_col}, ' ', ''), ',', '.')
                        AS DOUBLE
                    ))
                FROM {table_name}
            """).fetchone()
            non_empty, has_comma, castable = row
            if has_comma > 0 and non_empty > 0 and castable / non_empty >= 0.8:
                select_parts.append(
                    f"TRY_CAST(REPLACE(REPLACE({safe_col}, ' ', ''), ',', '.') AS DOUBLE) AS {safe_col}"
                )
                continue
        select_parts.append(safe_col)

    return ", ".join(select_parts)


def _convert_to_parquet(csv_path: Path, parquet_path: Path) -> None:
    """Convert CSV to Parquet using DuckDB, handling French number formats."""
    conn = duckdb.connect()
    try:
        csv_str = str(csv_path).replace("'", "''")
        parquet_str = str(parquet_path).replace("'", "''")
        fmt = _detect_csv_format(csv_path)
        read_expr = _build_read_csv_sql(csv_str, fmt)

        if fmt.get("decimal_separator") == ",":
            # French CSV: load into temp table, fix numbers, then export
            conn.execute(f"CREATE TEMP TABLE _raw AS SELECT * FROM {read_expr}")
            select_sql = _fix_french_numbers(conn, "_raw")
            conn.execute(
                f"COPY (SELECT {select_sql} FROM _raw) TO '{parquet_str}' (FORMAT PARQUET)"
            )
        else:
            conn.execute(
                f"COPY (SELECT * FROM {read_expr}) TO '{parquet_str}' (FORMAT PARQUET)"
            )
    except duckdb.Error as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse CSV: {str(e)}",
        )
    finally:
        conn.close()


def _infer_schema(parquet_path: Path) -> dict:
    """Infer column names, types, row count, and sample rows from the parquet file."""
    conn = duckdb.connect()
    try:
        parquet_str = str(parquet_path).replace("'", "''")
        rel = conn.sql(f"SELECT * FROM read_parquet('{parquet_str}')")
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
        schema_info = _infer_schema(parquet_path)
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
