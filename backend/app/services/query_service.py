"""Query service — SemanticQueryBuilder for DuckDB cross-CSV queries."""

import datetime
import decimal
import json
import re
import time
import uuid
from pathlib import Path
from typing import Any

import concurrent.futures

import duckdb
from sqlalchemy.orm import Session

from app.models.data_source import DataSource


# SQL statements that are NOT allowed (write operations)
_FORBIDDEN_SQL_PATTERN = re.compile(
    r"\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CALL|MERGE|UPSERT"
    r"|COPY|SET|ATTACH|DETACH|LOAD|INSTALL)\b",
    re.IGNORECASE,
)

# Maximum rows returned
DEFAULT_LIMIT = 10000
MAX_LIMIT = 50000


def _json_safe(val: object) -> object:
    """Convert non-JSON-serializable values to strings."""
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.isoformat()
    if isinstance(val, decimal.Decimal):
        return float(val)
    if isinstance(val, bytes):
        return val.hex()
    if isinstance(val, uuid.UUID):
        return str(val)
    return val


def _sanitize_sql(sql_text: str) -> str:
    """Validate that the SQL is a read-only SELECT query.

    Raises ValueError if the query contains forbidden statements.
    """
    stripped = sql_text.strip().rstrip(";").strip()
    if not stripped:
        raise ValueError("SQL query cannot be empty")

    # Reject embedded semicolons (multi-statement injection)
    if ";" in stripped:
        raise ValueError("Multiple SQL statements are not allowed")

    # Check for forbidden statements
    match = _FORBIDDEN_SQL_PATTERN.search(stripped)
    if match:
        raise ValueError(
            f"Forbidden SQL operation: {match.group(0).upper()}. Only SELECT queries are allowed."
        )

    # Must start with SELECT, WITH, or EXPLAIN
    first_word = stripped.split()[0].upper()
    if first_word not in ("SELECT", "WITH", "EXPLAIN"):
        raise ValueError(
            f"Query must start with SELECT, WITH, or EXPLAIN. Got: {first_word}"
        )

    return stripped


def _ensure_limit(sql_text: str, limit: int) -> str:
    """Append LIMIT clause if the query doesn't already have one."""
    upper = sql_text.upper()
    # Simple check: if LIMIT is already in the query, leave it
    if re.search(r"\bLIMIT\s+\d+", upper):
        return sql_text
    return f"{sql_text} LIMIT {limit}"


class SemanticQueryBuilder:
    """Creates DuckDB views from semantic layer definitions and executes SQL queries.

    Each instance manages an in-memory DuckDB connection with views registered
    from parquet files referenced in the semantic layer.
    """

    def __init__(self) -> None:
        self._conn: duckdb.DuckDBPyConnection | None = None

    def setup_context(
        self,
        definitions_json: dict,
        tenant_id: str | uuid.UUID,
        db: Session,
    ) -> list[str]:
        """Create DuckDB views for each table node in the semantic layer.

        Args:
            definitions_json: The semantic layer definitions with nodes and edges.
            tenant_id: Current tenant ID for data source lookup.
            db: SQLAlchemy session for looking up DataSource records.

        Returns:
            List of view names that were successfully created.

        Raises:
            ValueError: If definitions are invalid or data sources are not found.
        """
        self._conn = duckdb.connect()
        views_created: list[str] = []

        nodes = definitions_json.get("nodes", [])
        if not nodes:
            raise ValueError("Semantic layer has no table nodes defined")

        for node in nodes:
            data = node.get("data", {})
            source_id = data.get("source_id")
            source_name = data.get("source_name")

            if not source_id or not source_name:
                continue

            # Look up the DataSource record (with tenant isolation)
            ds = (
                db.query(DataSource)
                .filter(
                    DataSource.id == uuid.UUID(str(source_id)),
                    DataSource.tenant_id == uuid.UUID(str(tenant_id)),
                )
                .first()
            )
            if not ds:
                raise ValueError(
                    f"Data source '{source_name}' (id={source_id}) not found for this tenant"
                )

            # Get parquet path from connection config
            if not ds.connection_config_encrypted:
                raise ValueError(
                    f"Data source '{source_name}' has no storage configuration"
                )

            config = json.loads(ds.connection_config_encrypted)
            storage_path = config.get("storage_path")
            if not storage_path:
                raise ValueError(
                    f"Data source '{source_name}' has no storage path"
                )

            parquet_path = Path(storage_path) / "processed.parquet"
            if not parquet_path.exists():
                raise ValueError(
                    f"Parquet file not found for data source '{source_name}'"
                )

            # Sanitize view name: only alphanumeric and underscores, max 128 chars
            safe_name = re.sub(r"[^a-zA-Z0-9_]", "_", source_name)[:128]
            parquet_str = str(parquet_path).replace("'", "''")

            # Quote view name with double quotes to prevent keyword collisions
            self._conn.execute(
                f'CREATE VIEW "{safe_name}" AS SELECT * FROM read_parquet(\'{parquet_str}\')'
            )
            views_created.append(safe_name)

        if not views_created:
            raise ValueError("No views could be created from the semantic layer")

        return views_created

    def execute_query(
        self,
        sql_text: str,
        limit: int = DEFAULT_LIMIT,
        timeout_seconds: int = 30,
    ) -> dict[str, Any]:
        """Execute a sanitized SQL query against the DuckDB views.

        Args:
            sql_text: The SQL query to execute.
            limit: Maximum number of rows to return.
            timeout_seconds: Query timeout in seconds.

        Returns:
            Dict with columns, rows, row_count, and execution_time_ms.

        Raises:
            ValueError: If SQL is invalid or contains forbidden operations.
            RuntimeError: If no context has been set up.
            TimeoutError: If query exceeds timeout.
        """
        if not self._conn:
            raise RuntimeError("No query context set up. Call setup_context() first.")

        # Sanitize
        sanitized = _sanitize_sql(sql_text)

        # Enforce limit
        effective_limit = min(limit, MAX_LIMIT)
        sanitized = _ensure_limit(sanitized, effective_limit)

        start = time.monotonic()

        def _run_query() -> tuple[list[dict], list[dict]]:
            result = self._conn.execute(sanitized)  # type: ignore[union-attr]
            columns = [
                {"name": desc[0], "type": str(desc[1])}
                for desc in result.description
            ]
            raw_rows = result.fetchall()
            rows = [
                {col["name"]: _json_safe(val) for col, val in zip(columns, row)}
                for row in raw_rows
            ]
            return columns, rows

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(_run_query)
                columns, rows = future.result(timeout=timeout_seconds)

            elapsed_ms = round((time.monotonic() - start) * 1000, 2)

            return {
                "columns": columns,
                "rows": rows,
                "row_count": len(rows),
                "execution_time_ms": elapsed_ms,
            }
        except concurrent.futures.TimeoutError:
            # Cancel the connection to abort the running query
            if self._conn:
                self._conn.interrupt()
            raise TimeoutError(
                f"Query exceeded timeout of {timeout_seconds} seconds"
            )
        except duckdb.Error as e:
            raise ValueError(f"Query execution error: {str(e)}")

    def close(self) -> None:
        """Close the DuckDB connection."""
        if self._conn:
            self._conn.close()
            self._conn = None

    def __enter__(self) -> "SemanticQueryBuilder":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
