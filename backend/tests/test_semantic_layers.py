"""Tests for semantic layer CRUD endpoints."""

import uuid

import pytest

from tests.conftest import TENANT_ID

ENDPOINT_PREFIX = "/api/v1/semantic-layers"


@pytest.fixture
def workspace_id(client, auth_header):
    """Create a workspace and return its ID."""
    resp = client.post(
        "/api/v1/workspaces",
        headers=auth_header,
        json={"name": "Test Workspace", "settings": {}},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.fixture
def semantic_layer_data(workspace_id):
    """Sample semantic layer create data."""
    return {
        "workspace_id": workspace_id,
        "name": "Sales Model",
        "definitions_json": {
            "nodes": [{"id": "1", "type": "table", "data": {"name": "customers"}}],
            "edges": [],
        },
    }


class TestCreateSemanticLayer:
    def test_create_success(self, client, auth_header, semantic_layer_data):
        resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json=semantic_layer_data,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Sales Model"
        assert data["workspace_id"] == semantic_layer_data["workspace_id"]
        assert data["tenant_id"] == TENANT_ID
        assert data["definitions_json"] == semantic_layer_data["definitions_json"]
        assert "id" in data
        assert "created_at" in data
        assert data["updated_at"] is None

    def test_create_without_definitions(self, client, auth_header, workspace_id):
        resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json={"workspace_id": workspace_id, "name": "Empty Model"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Empty Model"
        assert data["definitions_json"] is None

    def test_create_requires_auth(self, client, semantic_layer_data):
        resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            json=semantic_layer_data,
        )
        assert resp.status_code == 403


class TestListSemanticLayers:
    def test_list_empty(self, client, auth_header, workspace_id):
        resp = client.get(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            params={"workspace_id": workspace_id},
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_after_create(self, client, auth_header, semantic_layer_data, workspace_id):
        # Create two semantic layers
        client.post(f"{ENDPOINT_PREFIX}/", headers=auth_header, json=semantic_layer_data)
        client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json={**semantic_layer_data, "name": "Second Model"},
        )

        resp = client.get(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            params={"workspace_id": workspace_id},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all("id" in item for item in data)
        assert all("name" in item for item in data)
        assert all("workspace_id" in item for item in data)
        assert all("created_at" in item for item in data)
        # List response shouldn't include definitions_json
        assert all("definitions_json" not in item for item in data)

    def test_list_requires_workspace_id(self, client, auth_header):
        resp = client.get(f"{ENDPOINT_PREFIX}/", headers=auth_header)
        assert resp.status_code == 422


class TestGetSemanticLayer:
    def test_get_by_id_success(self, client, auth_header, semantic_layer_data):
        # Create a semantic layer
        create_resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json=semantic_layer_data,
        )
        layer_id = create_resp.json()["id"]

        # Get by ID
        resp = client.get(f"{ENDPOINT_PREFIX}/{layer_id}", headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == layer_id
        assert data["name"] == "Sales Model"
        assert data["definitions_json"] is not None

    def test_get_nonexistent_returns_404(self, client, auth_header):
        fake_id = str(uuid.uuid4())
        resp = client.get(f"{ENDPOINT_PREFIX}/{fake_id}", headers=auth_header)
        assert resp.status_code == 404


class TestUpdateSemanticLayer:
    def test_update_name(self, client, auth_header, semantic_layer_data):
        # Create
        create_resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json=semantic_layer_data,
        )
        layer_id = create_resp.json()["id"]

        # Update name
        resp = client.put(
            f"{ENDPOINT_PREFIX}/{layer_id}",
            headers=auth_header,
            json={"name": "Updated Sales Model"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Updated Sales Model"
        assert data["definitions_json"] == semantic_layer_data["definitions_json"]  # Unchanged

    def test_update_definitions(self, client, auth_header, semantic_layer_data):
        # Create
        create_resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json=semantic_layer_data,
        )
        layer_id = create_resp.json()["id"]

        # Update definitions
        new_definitions = {"nodes": [{"id": "2", "type": "table"}], "edges": []}
        resp = client.put(
            f"{ENDPOINT_PREFIX}/{layer_id}",
            headers=auth_header,
            json={"definitions_json": new_definitions},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["definitions_json"] == new_definitions
        assert data["name"] == "Sales Model"  # Unchanged

    def test_update_both(self, client, auth_header, semantic_layer_data):
        # Create
        create_resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json=semantic_layer_data,
        )
        layer_id = create_resp.json()["id"]

        # Update both
        new_definitions = {"nodes": [], "edges": []}
        resp = client.put(
            f"{ENDPOINT_PREFIX}/{layer_id}",
            headers=auth_header,
            json={"name": "New Name", "definitions_json": new_definitions},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "New Name"
        assert data["definitions_json"] == new_definitions


class TestDeleteSemanticLayer:
    def test_delete_success(self, client, auth_header, semantic_layer_data):
        # Create
        create_resp = client.post(
            f"{ENDPOINT_PREFIX}/",
            headers=auth_header,
            json=semantic_layer_data,
        )
        layer_id = create_resp.json()["id"]

        # Delete
        resp = client.delete(f"{ENDPOINT_PREFIX}/{layer_id}", headers=auth_header)
        assert resp.status_code == 204

        # Verify it's gone
        get_resp = client.get(f"{ENDPOINT_PREFIX}/{layer_id}", headers=auth_header)
        assert get_resp.status_code == 404

    def test_delete_nonexistent_returns_404(self, client, auth_header):
        fake_id = str(uuid.uuid4())
        resp = client.delete(f"{ENDPOINT_PREFIX}/{fake_id}", headers=auth_header)
        assert resp.status_code == 404


class TestTenantIsolation:
    def test_tenant_cannot_see_other_tenant_layers(self, client, semantic_layer_data):
        # Register and login as tenant A
        tenant_a_email = "tenant_a@test.com"
        client.post(
            "/api/v1/auth/register",
            json={"email": tenant_a_email, "password": "Test1234!", "tenant_id": TENANT_ID},
        )
        login_a = client.post(
            "/api/v1/auth/login", json={"email": tenant_a_email, "password": "Test1234!"}
        )
        token_a = login_a.json()["access_token"]
        header_a = {"Authorization": f"Bearer {token_a}"}

        # Register and login as tenant B
        tenant_b_id = str(uuid.uuid4())
        tenant_b_email = "tenant_b@test.com"
        client.post(
            "/api/v1/auth/register",
            json={"email": tenant_b_email, "password": "Test1234!", "tenant_id": tenant_b_id},
        )
        login_b = client.post(
            "/api/v1/auth/login", json={"email": tenant_b_email, "password": "Test1234!"}
        )
        token_b = login_b.json()["access_token"]
        header_b = {"Authorization": f"Bearer {token_b}"}

        # Create workspace for tenant A
        workspace_a = client.post(
            "/api/v1/workspaces", headers=header_a, json={"name": "Workspace A"}
        )
        workspace_a_id = workspace_a.json()["id"]

        # Tenant A creates a semantic layer
        layer_data = {
            "workspace_id": workspace_a_id,
            "name": "Tenant A Model",
            "definitions_json": {"nodes": []},
        }
        create_resp = client.post(f"{ENDPOINT_PREFIX}/", headers=header_a, json=layer_data)
        layer_id = create_resp.json()["id"]

        # Tenant B tries to access tenant A's semantic layer
        resp = client.get(f"{ENDPOINT_PREFIX}/{layer_id}", headers=header_b)
        assert resp.status_code == 404

        # Tenant B tries to list tenant A's workspace layers
        resp = client.get(
            f"{ENDPOINT_PREFIX}/",
            headers=header_b,
            params={"workspace_id": workspace_a_id},
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 0  # Should see nothing
