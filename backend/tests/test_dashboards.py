"""Tests for Dashboard and Widget CRUD endpoints."""

import uuid

import pytest

TENANT_ID = "550e8400-e29b-41d4-a716-446655440000"
OTHER_TENANT_ID = "660e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def workspace_id(client, auth_header):
    """Create a workspace and return its ID."""
    resp = client.post(
        "/api/v1/workspaces/",
        json={"name": "Dashboard Test WS"},
        headers=auth_header,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.fixture
def dashboard_id(client, auth_header, workspace_id):
    """Create a dashboard and return its ID."""
    resp = client.post(
        "/api/v1/dashboards/",
        json={
            "workspace_id": workspace_id,
            "name": "My Dashboard",
            "description": "Test dashboard",
            "theme": "classic",
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.fixture
def other_auth_header(client):
    """Register and login a user with a different tenant, return auth header."""
    other_data = {
        "email": "other@datapilot.fr",
        "password": "Other1234!",
        "tenant_id": OTHER_TENANT_ID,
    }
    client.post("/api/v1/auth/register", json=other_data)
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": other_data["email"], "password": other_data["password"]},
    )
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}


# --- Dashboard CRUD ---


class TestDashboardCreate:
    def test_create_dashboard(self, client, auth_header, workspace_id):
        resp = client.post(
            "/api/v1/dashboards/",
            json={
                "workspace_id": workspace_id,
                "name": "Revenue Dashboard",
                "description": "Monthly revenue overview",
                "theme": "ocean",
            },
            headers=auth_header,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Revenue Dashboard"
        assert data["description"] == "Monthly revenue overview"
        assert data["theme"] == "ocean"
        assert data["workspace_id"] == workspace_id
        assert data["tenant_id"] == TENANT_ID

    def test_create_dashboard_defaults(self, client, auth_header, workspace_id):
        resp = client.post(
            "/api/v1/dashboards/",
            json={"workspace_id": workspace_id, "name": "Minimal"},
            headers=auth_header,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["theme"] == "classic"
        assert data["description"] is None

    def test_create_dashboard_requires_auth(self, client, workspace_id):
        resp = client.post(
            "/api/v1/dashboards/",
            json={"workspace_id": workspace_id, "name": "No Auth"},
        )
        assert resp.status_code == 403


class TestDashboardList:
    def test_list_dashboards(self, client, auth_header, workspace_id):
        for name in ["Dashboard A", "Dashboard B"]:
            client.post(
                "/api/v1/dashboards/",
                json={"workspace_id": workspace_id, "name": name},
                headers=auth_header,
            )

        resp = client.get(
            f"/api/v1/dashboards/?workspace_id={workspace_id}",
            headers=auth_header,
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_list_requires_workspace_id(self, client, auth_header):
        resp = client.get("/api/v1/dashboards/", headers=auth_header)
        assert resp.status_code == 422


class TestDashboardGet:
    def test_get_dashboard_with_widgets(self, client, auth_header, dashboard_id):
        resp = client.get(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_header,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == dashboard_id
        assert data["name"] == "My Dashboard"
        assert data["widgets"] == []

    def test_get_nonexistent_dashboard(self, client, auth_header):
        fake_id = str(uuid.uuid4())
        resp = client.get(
            f"/api/v1/dashboards/{fake_id}",
            headers=auth_header,
        )
        assert resp.status_code == 404


class TestDashboardUpdate:
    def test_update_dashboard(self, client, auth_header, dashboard_id):
        resp = client.put(
            f"/api/v1/dashboards/{dashboard_id}",
            json={"name": "Updated Name", "theme": "dark"},
            headers=auth_header,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Updated Name"
        assert data["theme"] == "dark"

    def test_update_nonexistent_dashboard(self, client, auth_header):
        fake_id = str(uuid.uuid4())
        resp = client.put(
            f"/api/v1/dashboards/{fake_id}",
            json={"name": "Ghost"},
            headers=auth_header,
        )
        assert resp.status_code == 404


class TestDashboardDelete:
    def test_delete_dashboard(self, client, auth_header, dashboard_id):
        resp = client.delete(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_header,
        )
        assert resp.status_code == 204

        # Verify gone
        resp = client.get(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_header,
        )
        assert resp.status_code == 404

    def test_delete_nonexistent(self, client, auth_header):
        fake_id = str(uuid.uuid4())
        resp = client.delete(
            f"/api/v1/dashboards/{fake_id}",
            headers=auth_header,
        )
        assert resp.status_code == 404


class TestDashboardTenantIsolation:
    def test_other_tenant_cannot_see_dashboard(
        self, client, auth_header, dashboard_id, other_auth_header
    ):
        resp = client.get(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=other_auth_header,
        )
        assert resp.status_code == 404

    def test_other_tenant_cannot_delete_dashboard(
        self, client, auth_header, dashboard_id, other_auth_header
    ):
        resp = client.delete(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=other_auth_header,
        )
        assert resp.status_code == 404

    def test_other_tenant_cannot_update_dashboard(
        self, client, auth_header, dashboard_id, other_auth_header
    ):
        resp = client.put(
            f"/api/v1/dashboards/{dashboard_id}",
            json={"name": "Hacked"},
            headers=other_auth_header,
        )
        assert resp.status_code == 404


# --- Widget CRUD ---


@pytest.fixture
def widget_data():
    return {
        "type": "chart",
        "title": "Revenue Chart",
        "chart_type": "bar",
        "config_json": {"kpiValue": "total_revenue"},
        "position": {"x": 0, "y": 0, "w": 6, "h": 4},
    }


@pytest.fixture
def widget_id(client, auth_header, dashboard_id, widget_data):
    """Create a widget and return its ID."""
    resp = client.post(
        f"/api/v1/dashboards/{dashboard_id}/widgets",
        json=widget_data,
        headers=auth_header,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


class TestWidgetCreate:
    def test_create_widget(self, client, auth_header, dashboard_id, widget_data):
        resp = client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=widget_data,
            headers=auth_header,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["type"] == "chart"
        assert data["title"] == "Revenue Chart"
        assert data["chart_type"] == "bar"
        assert data["dashboard_id"] == dashboard_id
        assert data["tenant_id"] == TENANT_ID

    def test_create_widget_invalid_type(self, client, auth_header, dashboard_id):
        resp = client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json={"type": "invalid", "title": "Bad", "chart_type": "bar"},
            headers=auth_header,
        )
        assert resp.status_code == 422

    def test_create_widget_on_nonexistent_dashboard(self, client, auth_header, widget_data):
        fake_id = str(uuid.uuid4())
        resp = client.post(
            f"/api/v1/dashboards/{fake_id}/widgets",
            json=widget_data,
            headers=auth_header,
        )
        assert resp.status_code == 404


class TestWidgetUpdate:
    def test_update_widget(self, client, auth_header, dashboard_id, widget_id):
        resp = client.put(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
            json={"title": "Updated Chart", "chart_type": "line"},
            headers=auth_header,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Updated Chart"
        assert data["chart_type"] == "line"

    def test_update_nonexistent_widget(self, client, auth_header, dashboard_id):
        fake_id = str(uuid.uuid4())
        resp = client.put(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{fake_id}",
            json={"title": "Ghost"},
            headers=auth_header,
        )
        assert resp.status_code == 404


class TestWidgetDelete:
    def test_delete_widget(self, client, auth_header, dashboard_id, widget_id):
        resp = client.delete(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
            headers=auth_header,
        )
        assert resp.status_code == 204

    def test_delete_nonexistent_widget(self, client, auth_header, dashboard_id):
        fake_id = str(uuid.uuid4())
        resp = client.delete(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{fake_id}",
            headers=auth_header,
        )
        assert resp.status_code == 404


class TestWidgetTenantIsolation:
    def test_other_tenant_cannot_create_widget(
        self, client, auth_header, dashboard_id, other_auth_header, widget_data
    ):
        resp = client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=widget_data,
            headers=other_auth_header,
        )
        # Dashboard not found for other tenant = 404
        assert resp.status_code == 404

    def test_other_tenant_cannot_update_widget(
        self, client, auth_header, dashboard_id, widget_id, other_auth_header
    ):
        resp = client.put(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
            json={"title": "Hacked"},
            headers=other_auth_header,
        )
        assert resp.status_code == 404

    def test_other_tenant_cannot_delete_widget(
        self, client, auth_header, dashboard_id, widget_id, other_auth_header
    ):
        resp = client.delete(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
            headers=other_auth_header,
        )
        assert resp.status_code == 404


class TestDashboardCascadeDelete:
    def test_delete_dashboard_cascades_widgets(
        self, client, auth_header, dashboard_id, widget_id, workspace_id
    ):
        """Deleting a dashboard should also delete its widgets."""
        # Verify widget exists
        resp = client.get(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_header,
        )
        assert len(resp.json()["widgets"]) == 1

        # Delete dashboard
        resp = client.delete(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_header,
        )
        assert resp.status_code == 204

        # Dashboard gone
        resp = client.get(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_header,
        )
        assert resp.status_code == 404
