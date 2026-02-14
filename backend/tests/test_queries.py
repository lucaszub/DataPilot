"""Tests for SemanticQueryBuilder, query execution endpoint, and SavedQuery CRUD."""

import json
import os
import tempfile
import uuid

import duckdb
import pytest
from fastapi.testclient import TestClient

from app.models.data_source import DataSource
from app.models.dashboard import SemanticLayer
from app.models.workspace import Workspace
from app.services.query_service import (
    SemanticQueryBuilder,
    _ensure_limit,
    _sanitize_sql,
)

TENANT_ID = "550e8400-e29b-41d4-a716-446655440000"


# --- Unit tests for SQL sanitization ---


class TestSanitizeSQL:
    def test_valid_select(self):
        result = _sanitize_sql("SELECT * FROM sales")
        assert result == "SELECT * FROM sales"

    def test_valid_with_cte(self):
        result = _sanitize_sql("WITH cte AS (SELECT 1) SELECT * FROM cte")
        assert "WITH" in result

    def test_valid_explain(self):
        result = _sanitize_sql("EXPLAIN SELECT * FROM sales")
        assert "EXPLAIN" in result

    def test_reject_drop(self):
        with pytest.raises(ValueError, match="Forbidden SQL operation: DROP"):
            _sanitize_sql("DROP TABLE sales")

    def test_reject_delete(self):
        with pytest.raises(ValueError, match="Forbidden SQL operation: DELETE"):
            _sanitize_sql("DELETE FROM sales WHERE id=1")

    def test_reject_insert(self):
        with pytest.raises(ValueError, match="Forbidden SQL operation: INSERT"):
            _sanitize_sql("INSERT INTO sales VALUES (1, 'test')")

    def test_reject_update(self):
        with pytest.raises(ValueError, match="Forbidden SQL operation: UPDATE"):
            _sanitize_sql("UPDATE sales SET name='x'")

    def test_reject_create(self):
        with pytest.raises(ValueError, match="Forbidden SQL operation: CREATE"):
            _sanitize_sql("CREATE TABLE evil (id INT)")

    def test_reject_alter(self):
        with pytest.raises(ValueError, match="Forbidden SQL operation: ALTER"):
            _sanitize_sql("ALTER TABLE sales ADD COLUMN x INT")

    def test_reject_truncate(self):
        with pytest.raises(ValueError, match="Forbidden SQL operation: TRUNCATE"):
            _sanitize_sql("TRUNCATE TABLE sales")

    def test_reject_empty(self):
        with pytest.raises(ValueError, match="cannot be empty"):
            _sanitize_sql("")

    def test_reject_non_select_start(self):
        with pytest.raises(ValueError, match="must start with SELECT"):
            _sanitize_sql("SHOW TABLES")

    def test_strips_semicolon(self):
        result = _sanitize_sql("SELECT 1;")
        assert result == "SELECT 1"


class TestEnsureLimit:
    def test_adds_limit_when_missing(self):
        result = _ensure_limit("SELECT * FROM sales", 100)
        assert result == "SELECT * FROM sales LIMIT 100"

    def test_preserves_existing_limit(self):
        result = _ensure_limit("SELECT * FROM sales LIMIT 50", 100)
        assert result == "SELECT * FROM sales LIMIT 50"


# --- Unit tests for SemanticQueryBuilder ---


@pytest.fixture
def parquet_dir():
    """Create a temporary directory with a test parquet file."""
    with tempfile.TemporaryDirectory() as tmpdir:
        csv_content = "id,name,amount\n1,Alice,100.0\n2,Bob,200.0\n3,Charlie,150.0\n"
        csv_path = os.path.join(tmpdir, "original.csv")
        parquet_path = os.path.join(tmpdir, "processed.parquet")

        with open(csv_path, "w") as f:
            f.write(csv_content)

        conn = duckdb.connect()
        csv_str = csv_path.replace("'", "''")
        pq_str = parquet_path.replace("'", "''")
        conn.execute(
            f"COPY (SELECT * FROM read_csv_auto('{csv_str}')) TO '{pq_str}' (FORMAT PARQUET)"
        )
        conn.close()

        yield tmpdir


class TestSemanticQueryBuilder:
    def test_setup_and_execute(self, db_session, parquet_dir):
        """Test full flow: setup context with a data source, then execute query."""
        tenant_uuid = uuid.UUID(TENANT_ID)

        # Create a workspace
        ws = Workspace(id=uuid.uuid4(), tenant_id=tenant_uuid, name="Test WS")
        db_session.add(ws)
        db_session.commit()

        # Create a data source pointing to our parquet
        ds_id = uuid.uuid4()
        ds = DataSource(
            id=ds_id,
            tenant_id=tenant_uuid,
            type="csv",
            name="sales",
            connection_config_encrypted=json.dumps({"storage_path": parquet_dir}),
            schema_cache={"columns": [{"name": "id", "type": "BIGINT"}], "row_count": 3},
        )
        db_session.add(ds)
        db_session.commit()

        definitions = {
            "nodes": [
                {
                    "id": "node-1",
                    "type": "tableNode",
                    "data": {
                        "source_id": str(ds_id),
                        "source_name": "sales",
                        "columns": [
                            {"name": "id", "type": "BIGINT", "role": "dimension"},
                            {"name": "name", "type": "VARCHAR", "role": "dimension"},
                            {"name": "amount", "type": "DOUBLE", "role": "measure"},
                        ],
                    },
                }
            ],
            "edges": [],
        }

        builder = SemanticQueryBuilder()
        try:
            views = builder.setup_context(definitions, TENANT_ID, db_session)
            assert views == ["sales"]

            result = builder.execute_query("SELECT * FROM sales ORDER BY id")
            assert result["row_count"] == 3
            assert len(result["columns"]) == 3
            assert result["rows"][0]["name"] == "Alice"
            assert result["execution_time_ms"] >= 0
        finally:
            builder.close()

    def test_execute_without_context(self):
        """Test that executing without setup raises RuntimeError."""
        builder = SemanticQueryBuilder()
        with pytest.raises(RuntimeError, match="No query context"):
            builder.execute_query("SELECT 1")

    def test_setup_empty_nodes(self, db_session):
        """Test setup with no nodes raises ValueError."""
        builder = SemanticQueryBuilder()
        with pytest.raises(ValueError, match="no table nodes"):
            builder.setup_context({"nodes": [], "edges": []}, TENANT_ID, db_session)

    def test_setup_missing_datasource(self, db_session):
        """Test that missing data source raises ValueError."""
        definitions = {
            "nodes": [
                {
                    "id": "node-1",
                    "type": "tableNode",
                    "data": {
                        "source_id": str(uuid.uuid4()),
                        "source_name": "nonexistent",
                        "columns": [],
                    },
                }
            ],
            "edges": [],
        }
        builder = SemanticQueryBuilder()
        with pytest.raises(ValueError, match="not found"):
            builder.setup_context(definitions, TENANT_ID, db_session)

    def test_context_manager(self, db_session, parquet_dir):
        """Test that context manager properly closes connection."""
        tenant_uuid = uuid.UUID(TENANT_ID)
        ds_id = uuid.uuid4()
        ds = DataSource(
            id=ds_id,
            tenant_id=tenant_uuid,
            type="csv",
            name="test_table",
            connection_config_encrypted=json.dumps({"storage_path": parquet_dir}),
        )
        db_session.add(ds)
        db_session.commit()

        definitions = {
            "nodes": [
                {
                    "id": "node-1",
                    "data": {"source_id": str(ds_id), "source_name": "test_table", "columns": []},
                }
            ],
            "edges": [],
        }

        with SemanticQueryBuilder() as builder:
            builder.setup_context(definitions, TENANT_ID, db_session)
            result = builder.execute_query("SELECT COUNT(*) AS cnt FROM test_table")
            assert result["rows"][0]["cnt"] == 3

    def test_forbidden_sql_rejected(self, db_session, parquet_dir):
        """Test that forbidden SQL is rejected during execution."""
        tenant_uuid = uuid.UUID(TENANT_ID)
        ds_id = uuid.uuid4()
        ds = DataSource(
            id=ds_id,
            tenant_id=tenant_uuid,
            type="csv",
            name="tbl",
            connection_config_encrypted=json.dumps({"storage_path": parquet_dir}),
        )
        db_session.add(ds)
        db_session.commit()

        definitions = {
            "nodes": [{"id": "n1", "data": {"source_id": str(ds_id), "source_name": "tbl", "columns": []}}],
            "edges": [],
        }

        with SemanticQueryBuilder() as builder:
            builder.setup_context(definitions, TENANT_ID, db_session)
            with pytest.raises(ValueError, match="Forbidden SQL operation"):
                builder.execute_query("DROP TABLE tbl")

    def test_limit_enforced(self, db_session, parquet_dir):
        """Test that LIMIT is enforced on queries without one."""
        tenant_uuid = uuid.UUID(TENANT_ID)
        ds_id = uuid.uuid4()
        ds = DataSource(
            id=ds_id,
            tenant_id=tenant_uuid,
            type="csv",
            name="data",
            connection_config_encrypted=json.dumps({"storage_path": parquet_dir}),
        )
        db_session.add(ds)
        db_session.commit()

        definitions = {
            "nodes": [{"id": "n1", "data": {"source_id": str(ds_id), "source_name": "data", "columns": []}}],
            "edges": [],
        }

        with SemanticQueryBuilder() as builder:
            builder.setup_context(definitions, TENANT_ID, db_session)
            # Execute with limit=2 — should only return 2 rows
            result = builder.execute_query("SELECT * FROM data", limit=2)
            assert result["row_count"] == 2


# --- Integration tests for /api/v1/queries endpoints ---


@pytest.fixture
def workspace_id(client, auth_header, db_session):
    """Create a workspace and return its ID."""
    resp = client.post(
        "/api/v1/workspaces/",
        json={"name": "Test Workspace"},
        headers=auth_header,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.fixture
def setup_semantic_layer(client, auth_header, db_session, workspace_id, parquet_dir):
    """Create a data source + semantic layer pointing to test parquet."""
    # Insert data source directly into DB
    tenant_uuid = uuid.UUID(TENANT_ID)
    ds_id = uuid.uuid4()
    ds = DataSource(
        id=ds_id,
        tenant_id=tenant_uuid,
        type="csv",
        name="products",
        connection_config_encrypted=json.dumps({"storage_path": parquet_dir}),
        schema_cache={"columns": [], "row_count": 3},
    )
    db_session.add(ds)
    db_session.commit()

    definitions = {
        "nodes": [
            {
                "id": "node-1",
                "type": "tableNode",
                "data": {
                    "source_id": str(ds_id),
                    "source_name": "products",
                    "columns": [
                        {"name": "id", "type": "BIGINT", "role": "dimension"},
                        {"name": "name", "type": "VARCHAR", "role": "dimension"},
                        {"name": "amount", "type": "DOUBLE", "role": "measure"},
                    ],
                },
            }
        ],
        "edges": [],
    }

    resp = client.post(
        "/api/v1/semantic-layers/",
        json={
            "workspace_id": workspace_id,
            "name": "Test Layer",
            "definitions_json": definitions,
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    return {"workspace_id": workspace_id, "ds_id": str(ds_id)}


class TestQueryExecuteEndpoint:
    def test_execute_query_success(self, client, auth_header, setup_semantic_layer):
        """Test successful query execution via API."""
        resp = client.post(
            "/api/v1/queries/execute",
            json={
                "sql_text": "SELECT * FROM products ORDER BY id",
                "workspace_id": setup_semantic_layer["workspace_id"],
            },
            headers=auth_header,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["row_count"] == 3
        assert len(data["columns"]) == 3
        assert data["execution_time_ms"] >= 0

    def test_execute_forbidden_sql(self, client, auth_header, setup_semantic_layer):
        """Test that forbidden SQL returns 400."""
        resp = client.post(
            "/api/v1/queries/execute",
            json={
                "sql_text": "DROP TABLE products",
                "workspace_id": setup_semantic_layer["workspace_id"],
            },
            headers=auth_header,
        )
        assert resp.status_code == 400
        assert "Forbidden" in resp.json()["detail"]

    def test_execute_no_semantic_layer(self, client, auth_header, workspace_id):
        """Test that missing semantic layer returns 404."""
        resp = client.post(
            "/api/v1/queries/execute",
            json={
                "sql_text": "SELECT 1",
                "workspace_id": workspace_id,
            },
            headers=auth_header,
        )
        assert resp.status_code == 404

    def test_execute_requires_auth(self, client, setup_semantic_layer):
        """Test that unauthenticated request returns 403."""
        resp = client.post(
            "/api/v1/queries/execute",
            json={
                "sql_text": "SELECT 1",
                "workspace_id": setup_semantic_layer["workspace_id"],
            },
        )
        assert resp.status_code == 403

    def test_execute_invalid_sql(self, client, auth_header, setup_semantic_layer):
        """Test that invalid SQL returns 400."""
        resp = client.post(
            "/api/v1/queries/execute",
            json={
                "sql_text": "SELECT * FROM nonexistent_table",
                "workspace_id": setup_semantic_layer["workspace_id"],
            },
            headers=auth_header,
        )
        assert resp.status_code == 400


class TestSavedQueryCRUD:
    def test_create_saved_query(self, client, auth_header, workspace_id):
        """Test creating a saved query."""
        resp = client.post(
            "/api/v1/queries/saved",
            json={
                "name": "Top Products",
                "sql_text": "SELECT * FROM products LIMIT 10",
                "workspace_id": workspace_id,
                "chart_type": "bar",
            },
            headers=auth_header,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Top Products"
        assert data["sql_text"] == "SELECT * FROM products LIMIT 10"
        assert data["chart_type"] == "bar"
        assert data["workspace_id"] == workspace_id

    def test_list_saved_queries(self, client, auth_header, workspace_id):
        """Test listing saved queries for a workspace."""
        # Create two queries
        for name in ["Query A", "Query B"]:
            client.post(
                "/api/v1/queries/saved",
                json={"name": name, "sql_text": "SELECT 1", "workspace_id": workspace_id},
                headers=auth_header,
            )

        resp = client.get(
            f"/api/v1/queries/saved?workspace_id={workspace_id}",
            headers=auth_header,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_get_saved_query(self, client, auth_header, workspace_id):
        """Test getting a saved query by ID."""
        create_resp = client.post(
            "/api/v1/queries/saved",
            json={"name": "My Query", "sql_text": "SELECT 1", "workspace_id": workspace_id},
            headers=auth_header,
        )
        query_id = create_resp.json()["id"]

        resp = client.get(f"/api/v1/queries/saved/{query_id}", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["name"] == "My Query"

    def test_update_saved_query(self, client, auth_header, workspace_id):
        """Test updating a saved query."""
        create_resp = client.post(
            "/api/v1/queries/saved",
            json={"name": "Original", "sql_text": "SELECT 1", "workspace_id": workspace_id},
            headers=auth_header,
        )
        query_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/v1/queries/saved/{query_id}",
            json={"name": "Updated", "chart_type": "line"},
            headers=auth_header,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"
        assert resp.json()["chart_type"] == "line"

    def test_delete_saved_query(self, client, auth_header, workspace_id):
        """Test deleting a saved query."""
        create_resp = client.post(
            "/api/v1/queries/saved",
            json={"name": "To Delete", "sql_text": "SELECT 1", "workspace_id": workspace_id},
            headers=auth_header,
        )
        query_id = create_resp.json()["id"]

        resp = client.delete(f"/api/v1/queries/saved/{query_id}", headers=auth_header)
        assert resp.status_code == 204

        # Verify it's gone
        resp = client.get(f"/api/v1/queries/saved/{query_id}", headers=auth_header)
        assert resp.status_code == 404

    def test_tenant_isolation(self, client, auth_header, workspace_id, db_session):
        """Test that saved queries are isolated by tenant_id."""
        # Create a query for our tenant
        create_resp = client.post(
            "/api/v1/queries/saved",
            json={"name": "My Query", "sql_text": "SELECT 1", "workspace_id": workspace_id},
            headers=auth_header,
        )
        query_id = create_resp.json()["id"]

        # Register a second user with different tenant
        other_tenant_data = {
            "email": "other@datapilot.fr",
            "password": "Other1234!",
            "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
        }
        client.post("/api/v1/auth/register", json=other_tenant_data)
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": other_tenant_data["email"], "password": other_tenant_data["password"]},
        )
        other_header = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # Other tenant should not see the query
        resp = client.get(f"/api/v1/queries/saved/{query_id}", headers=other_header)
        assert resp.status_code == 404

    def test_saved_query_requires_auth(self, client, workspace_id):
        """Test that saved query endpoints require authentication."""
        resp = client.post(
            "/api/v1/queries/saved",
            json={"name": "Test", "sql_text": "SELECT 1", "workspace_id": workspace_id},
        )
        assert resp.status_code == 403
