"""Tests for AIService and AI query endpoint."""

import json
import uuid
from unittest.mock import MagicMock, patch

import pytest

from app.models.dashboard import SemanticLayer
from app.models.workspace import Workspace
from app.services.ai_service import AIService

TENANT_ID = "550e8400-e29b-41d4-a716-446655440000"


# --- Unit tests for AIService ---


class TestBuildSchemaPrompt:
    """Test schema prompt generation from semantic layer definitions."""

    def test_basic_schema(self):
        svc = AIService()
        definitions = {
            "nodes": [
                {
                    "id": "node-1",
                    "data": {
                        "source_name": "ventes",
                        "source_id": str(uuid.uuid4()),
                        "label": "ventes",
                        "columns": [
                            {"name": "date", "type": "DATE", "role": "dimension"},
                            {"name": "montant", "type": "DOUBLE", "role": "measure"},
                            {"name": "categorie", "type": "VARCHAR", "role": "dimension"},
                        ],
                    },
                }
            ],
            "edges": [],
        }
        prompt = svc.build_schema_prompt(definitions)
        assert '"ventes"' in prompt
        assert "date (DATE) [dimension]" in prompt
        assert "montant (DOUBLE) [measure]" in prompt

    def test_schema_with_edges(self):
        svc = AIService()
        definitions = {
            "nodes": [
                {
                    "id": "n1",
                    "data": {
                        "source_name": "orders",
                        "source_id": str(uuid.uuid4()),
                        "columns": [
                            {"name": "id", "type": "INTEGER", "role": "dimension"},
                        ],
                    },
                },
                {
                    "id": "n2",
                    "data": {
                        "source_name": "customers",
                        "source_id": str(uuid.uuid4()),
                        "columns": [
                            {"name": "id", "type": "INTEGER", "role": "dimension"},
                        ],
                    },
                },
            ],
            "edges": [
                {
                    "source": "n1",
                    "target": "n2",
                    "data": {
                        "join_type": "LEFT JOIN",
                        "source_column": "customer_id",
                        "target_column": "id",
                    },
                }
            ],
        }
        prompt = svc.build_schema_prompt(definitions)
        assert "Relations (JOINs)" in prompt
        assert "LEFT JOIN" in prompt
        assert "customer_id" in prompt

    def test_empty_nodes(self):
        svc = AIService()
        definitions = {"nodes": [], "edges": []}
        prompt = svc.build_schema_prompt(definitions)
        assert prompt == ""

    def test_sanitizes_special_chars(self):
        svc = AIService()
        definitions = {
            "nodes": [
                {
                    "id": "n1",
                    "data": {
                        "source_name": "export-operations_2026",
                        "source_id": str(uuid.uuid4()),
                        "columns": [
                            {"name": "amount", "type": "DOUBLE", "role": "measure"},
                        ],
                    },
                }
            ],
            "edges": [],
        }
        prompt = svc.build_schema_prompt(definitions)
        # Dashes should be replaced with underscores
        assert '"export_operations_2026"' in prompt


class TestSuggestChartType:
    """Test chart type heuristic."""

    def test_kpi_single_numeric(self):
        svc = AIService()
        result = svc.suggest_chart_type(
            columns=[{"name": "total", "type": "BIGINT"}],
            row_count=1,
        )
        assert result == "kpi"

    def test_kpi_with_label(self):
        svc = AIService()
        result = svc.suggest_chart_type(
            columns=[
                {"name": "label", "type": "VARCHAR"},
                {"name": "total", "type": "DOUBLE"},
            ],
            row_count=1,
        )
        assert result == "kpi"

    def test_line_chart_date_numeric(self):
        svc = AIService()
        result = svc.suggest_chart_type(
            columns=[
                {"name": "date", "type": "DATE"},
                {"name": "revenue", "type": "DOUBLE"},
            ],
            row_count=30,
        )
        assert result == "line"

    def test_bar_chart_category_numeric(self):
        svc = AIService()
        result = svc.suggest_chart_type(
            columns=[
                {"name": "category", "type": "VARCHAR"},
                {"name": "count", "type": "BIGINT"},
            ],
            row_count=20,
        )
        assert result == "bar"

    def test_pie_chart_few_categories(self):
        svc = AIService()
        result = svc.suggest_chart_type(
            columns=[
                {"name": "category", "type": "VARCHAR"},
                {"name": "pct", "type": "DOUBLE"},
            ],
            row_count=5,
        )
        assert result == "pie"

    def test_table_fallback(self):
        svc = AIService()
        result = svc.suggest_chart_type(
            columns=[
                {"name": "id", "type": "INTEGER"},
                {"name": "value", "type": "INTEGER"},
            ],
            row_count=100,
        )
        assert result == "table"

    def test_empty_results(self):
        svc = AIService()
        result = svc.suggest_chart_type(columns=[], row_count=0)
        assert result is None


class TestParseResponse:
    """Test Claude response parsing."""

    def test_valid_json(self):
        svc = AIService()
        raw = json.dumps({
            "sql": "SELECT COUNT(*) FROM ventes",
            "explanation": "Compte les ventes",
            "suggested_chart": "kpi",
        })
        result = svc._parse_response(raw)
        assert result["sql"] == "SELECT COUNT(*) FROM ventes"
        assert result["explanation"] == "Compte les ventes"
        assert result["suggested_chart"] == "kpi"

    def test_json_in_code_block(self):
        svc = AIService()
        raw = '```json\n{"sql": "SELECT 1", "explanation": "test", "suggested_chart": "table"}\n```'
        result = svc._parse_response(raw)
        assert result["sql"] == "SELECT 1"

    def test_invalid_chart_type_ignored(self):
        svc = AIService()
        raw = json.dumps({
            "sql": "SELECT 1",
            "explanation": "test",
            "suggested_chart": "invalid_type",
        })
        result = svc._parse_response(raw)
        assert result["suggested_chart"] is None

    def test_missing_sql_raises(self):
        svc = AIService()
        raw = json.dumps({"explanation": "test"})
        with pytest.raises(ValueError, match="missing 'sql' field"):
            svc._parse_response(raw)

    def test_invalid_json_raises(self):
        svc = AIService()
        with pytest.raises(ValueError, match="invalid JSON"):
            svc._parse_response("this is not json at all")

    def test_missing_explanation_defaults_empty(self):
        svc = AIService()
        raw = json.dumps({"sql": "SELECT 1"})
        result = svc._parse_response(raw)
        assert result["explanation"] == ""

    def test_no_chart_defaults_none(self):
        svc = AIService()
        raw = json.dumps({"sql": "SELECT 1", "explanation": "test"})
        result = svc._parse_response(raw)
        assert result["suggested_chart"] is None


class TestEnsureClient:
    """Test API key validation."""

    def test_no_api_key_raises(self):
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.anthropic_api_key = ""
            svc = AIService()
            with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
                svc._ensure_client()


# --- Endpoint integration tests ---


class TestAIQueryEndpoint:
    """Test POST /api/v1/ai/query endpoint."""

    def _setup_workspace_and_semantic_layer(self, db_session, tenant_id: str):
        """Create workspace + semantic layer for testing."""
        workspace = Workspace(
            id=uuid.uuid4(),
            tenant_id=uuid.UUID(tenant_id),
            name="Test Workspace",
        )
        db_session.add(workspace)
        db_session.commit()

        semantic_layer = SemanticLayer(
            id=uuid.uuid4(),
            tenant_id=uuid.UUID(tenant_id),
            workspace_id=workspace.id,
            name="Test Layer",
            definitions_json={
                "nodes": [
                    {
                        "id": "n1",
                        "data": {
                            "source_name": "ventes",
                            "source_id": str(uuid.uuid4()),
                            "columns": [
                                {"name": "montant", "type": "DOUBLE", "role": "measure"},
                            ],
                        },
                    }
                ],
                "edges": [],
            },
        )
        db_session.add(semantic_layer)
        db_session.commit()
        return workspace

    def test_requires_auth(self, client):
        resp = client.post("/api/v1/ai/query", json={
            "question": "combien de ventes ?",
            "workspace_id": str(uuid.uuid4()),
        })
        assert resp.status_code == 403

    def test_no_semantic_layer_400(self, client, auth_header):
        resp = client.post(
            "/api/v1/ai/query",
            json={
                "question": "combien de ventes ?",
                "workspace_id": str(uuid.uuid4()),
            },
            headers=auth_header,
        )
        assert resp.status_code == 400
        assert "No semantic model" in resp.json()["detail"]

    def test_missing_api_key_503(self, client, auth_header, db_session):
        workspace = self._setup_workspace_and_semantic_layer(db_session, TENANT_ID)
        with patch("app.routers.ai.AIService") as MockService:
            instance = MockService.return_value
            instance._ensure_client.side_effect = RuntimeError("not configured")
            resp = client.post(
                "/api/v1/ai/query",
                json={
                    "question": "combien de ventes ?",
                    "workspace_id": str(workspace.id),
                },
                headers=auth_header,
            )
        assert resp.status_code == 503
        assert "not configured" in resp.json()["detail"]

    def test_question_too_short(self, client, auth_header):
        resp = client.post(
            "/api/v1/ai/query",
            json={
                "question": "ab",
                "workspace_id": str(uuid.uuid4()),
            },
            headers=auth_header,
        )
        assert resp.status_code == 422

    def test_tenant_isolation(self, client, auth_header, db_session):
        """Semantic layer from another tenant should not be found."""
        other_tenant = "660e8400-e29b-41d4-a716-446655440001"
        workspace = Workspace(
            id=uuid.uuid4(),
            tenant_id=uuid.UUID(other_tenant),
            name="Other Tenant WS",
        )
        db_session.add(workspace)
        db_session.commit()

        semantic_layer = SemanticLayer(
            id=uuid.uuid4(),
            tenant_id=uuid.UUID(other_tenant),
            workspace_id=workspace.id,
            name="Other Layer",
            definitions_json={"nodes": [], "edges": []},
        )
        db_session.add(semantic_layer)
        db_session.commit()

        resp = client.post(
            "/api/v1/ai/query",
            json={
                "question": "combien de ventes ?",
                "workspace_id": str(workspace.id),
            },
            headers=auth_header,
        )
        # Should get 400 because the semantic layer belongs to another tenant
        assert resp.status_code == 400
        assert "No semantic model" in resp.json()["detail"]

    @patch("app.routers.ai.SemanticQueryBuilder")
    @patch("app.routers.ai.AIService")
    def test_full_flow_success(
        self, MockAIService, MockBuilder, client, auth_header, db_session
    ):
        """Test happy path with mocked AI service and query builder."""
        workspace = self._setup_workspace_and_semantic_layer(db_session, TENANT_ID)

        # Mock AI service
        ai_instance = MockAIService.return_value
        ai_instance._ensure_client.return_value = MagicMock()
        ai_instance.generate_sql = MagicMock(return_value={
            "sql": 'SELECT SUM(montant) AS total FROM "ventes"',
            "explanation": "Somme des montants de ventes",
            "suggested_chart": "kpi",
        })
        ai_instance.suggest_chart_type.return_value = "kpi"

        # Make generate_sql a coroutine
        import asyncio
        ai_instance.generate_sql.return_value = {
            "sql": 'SELECT SUM(montant) AS total FROM "ventes"',
            "explanation": "Somme des montants de ventes",
            "suggested_chart": "kpi",
        }

        async def mock_generate_sql(**kwargs):
            return {
                "sql": 'SELECT SUM(montant) AS total FROM "ventes"',
                "explanation": "Somme des montants de ventes",
                "suggested_chart": "kpi",
            }

        ai_instance.generate_sql = mock_generate_sql

        # Mock query builder
        builder_instance = MockBuilder.return_value
        builder_instance.setup_context.return_value = ["ventes"]
        builder_instance.execute_query.return_value = {
            "columns": [{"name": "total", "type": "DOUBLE"}],
            "rows": [{"total": 42000.0}],
            "row_count": 1,
            "execution_time_ms": 5.2,
        }

        resp = client.post(
            "/api/v1/ai/query",
            json={
                "question": "quel est le montant total des ventes ?",
                "workspace_id": str(workspace.id),
            },
            headers=auth_header,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["sql"] == 'SELECT SUM(montant) AS total FROM "ventes"'
        assert body["explanation"] == "Somme des montants de ventes"
        assert body["suggested_chart"] == "kpi"
        assert body["results"]["row_count"] == 1
        assert body["results"]["rows"][0]["total"] == 42000.0

    @patch("app.routers.ai.SemanticQueryBuilder")
    @patch("app.routers.ai.AIService")
    def test_retry_on_first_failure(
        self, MockAIService, MockBuilder, client, auth_header, db_session
    ):
        """Test that a failed first SQL attempt triggers a retry."""
        workspace = self._setup_workspace_and_semantic_layer(db_session, TENANT_ID)

        ai_instance = MockAIService.return_value
        ai_instance._ensure_client.return_value = MagicMock()

        async def mock_generate_sql(**kwargs):
            return {
                "sql": "SELECT bad_column FROM ventes",
                "explanation": "tentative 1",
                "suggested_chart": "table",
            }

        async def mock_retry(**kwargs):
            return {
                "sql": 'SELECT SUM(montant) FROM "ventes"',
                "explanation": "tentative 2 corrigee",
                "suggested_chart": "kpi",
            }

        ai_instance.generate_sql = mock_generate_sql
        ai_instance.generate_sql_with_retry = mock_retry
        ai_instance.suggest_chart_type.return_value = "kpi"

        # First builder call fails, second succeeds
        builder_instance = MockBuilder.return_value
        call_count = {"n": 0}

        def mock_execute(sql_text, limit=1000):
            call_count["n"] += 1
            if call_count["n"] == 1:
                raise ValueError("Column bad_column not found")
            return {
                "columns": [{"name": "sum(montant)", "type": "DOUBLE"}],
                "rows": [{"sum(montant)": 42000.0}],
                "row_count": 1,
                "execution_time_ms": 3.1,
            }

        builder_instance.setup_context.return_value = ["ventes"]
        builder_instance.execute_query = mock_execute

        resp = client.post(
            "/api/v1/ai/query",
            json={
                "question": "total des ventes",
                "workspace_id": str(workspace.id),
            },
            headers=auth_header,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["explanation"] == "tentative 2 corrigee"
