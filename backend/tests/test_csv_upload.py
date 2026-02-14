"""Tests for CSV upload service and data sources endpoints."""

import io
import json
import os
import shutil
import uuid
from unittest.mock import patch

import pytest

from tests.conftest import TENANT_ID


CSV_CONTENT = b"name,age,city\nAlice,30,Paris\nBob,25,Lyon\nCharlie,35,Marseille\n"
UPLOAD_PREFIX = "/api/v1/data-sources"


@pytest.fixture
def tmp_upload_dir(tmp_path):
    """Override upload_dir setting to use a temp directory."""
    with patch("app.services.csv_service.settings") as mock_settings:
        mock_settings.upload_dir = str(tmp_path)
        mock_settings.max_upload_size_mb = 100
        yield tmp_path


@pytest.fixture
def csv_file():
    return ("test_data.csv", io.BytesIO(CSV_CONTENT), "text/csv")


class TestCSVUpload:
    def test_upload_csv_success(self, client, auth_header, tmp_upload_dir, csv_file):
        resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "Test Dataset"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test Dataset"
        assert data["type"] == "csv"
        assert data["tenant_id"] == TENANT_ID
        assert data["schema_cache"] is not None
        assert data["schema_cache"]["row_count"] == 3
        assert len(data["schema_cache"]["columns"]) == 3
        assert data["schema_cache"]["columns"][0]["name"] == "name"

    def test_upload_csv_creates_files(self, client, auth_header, tmp_upload_dir, csv_file):
        resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "File Test"},
        )
        assert resp.status_code == 201
        ds_id = resp.json()["id"]
        ds_path = tmp_upload_dir / TENANT_ID / ds_id
        assert (ds_path / "original.csv").exists()
        assert (ds_path / "processed.parquet").exists()

    def test_upload_non_csv_rejected(self, client, auth_header, tmp_upload_dir):
        resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": ("data.txt", io.BytesIO(b"hello"), "text/plain")},
            data={"name": "Bad File"},
        )
        assert resp.status_code == 400
        assert "Only .csv" in resp.json()["detail"]

    def test_upload_requires_auth(self, client, tmp_upload_dir, csv_file):
        resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            files={"file": csv_file},
            data={"name": "No Auth"},
        )
        assert resp.status_code == 403

    def test_upload_empty_csv_rejected(self, client, auth_header, tmp_upload_dir):
        resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
            data={"name": "Empty CSV"},
        )
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()


class TestDataSourcesList:
    def test_list_empty(self, client, auth_header):
        resp = client.get(f"{UPLOAD_PREFIX}/", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_after_upload(self, client, auth_header, tmp_upload_dir, csv_file):
        client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "Listed DS"},
        )
        resp = client.get(f"{UPLOAD_PREFIX}/", headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Listed DS"
        assert data[0]["row_count"] == 3
        assert data[0]["column_count"] == 3


class TestDataSourceGet:
    def test_get_by_id(self, client, auth_header, tmp_upload_dir, csv_file):
        upload_resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "Get Test"},
        )
        ds_id = upload_resp.json()["id"]
        resp = client.get(f"{UPLOAD_PREFIX}/{ds_id}", headers=auth_header)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Get Test"

    def test_get_nonexistent(self, client, auth_header):
        fake_id = str(uuid.uuid4())
        resp = client.get(f"{UPLOAD_PREFIX}/{fake_id}", headers=auth_header)
        assert resp.status_code == 404


class TestDataSourceDelete:
    def test_delete_removes_record(self, client, auth_header, tmp_upload_dir, csv_file):
        upload_resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "Delete Test"},
        )
        ds_id = upload_resp.json()["id"]
        resp = client.delete(f"{UPLOAD_PREFIX}/{ds_id}", headers=auth_header)
        assert resp.status_code == 204
        resp = client.get(f"{UPLOAD_PREFIX}/{ds_id}", headers=auth_header)
        assert resp.status_code == 404

    def test_delete_removes_files(self, client, auth_header, tmp_upload_dir, csv_file):
        upload_resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "File Delete"},
        )
        ds_id = upload_resp.json()["id"]
        ds_path = tmp_upload_dir / TENANT_ID / ds_id
        assert ds_path.exists()
        client.delete(f"{UPLOAD_PREFIX}/{ds_id}", headers=auth_header)
        assert not ds_path.exists()


class TestMultiTenantIsolation:
    def test_cannot_access_other_tenant_source(self, client, auth_header, tmp_upload_dir, csv_file, db_session):
        upload_resp = client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "Tenant A DS"},
        )
        ds_id = upload_resp.json()["id"]

        other_tenant_data = {
            "email": "other@datapilot.fr",
            "password": "Other1234!",
            "tenant_id": str(uuid.uuid4()),
        }
        client.post("/api/v1/auth/register", json=other_tenant_data)
        login_resp = client.post("/api/v1/auth/login", json={
            "email": other_tenant_data["email"],
            "password": other_tenant_data["password"],
        })
        other_header = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        resp = client.get(f"{UPLOAD_PREFIX}/{ds_id}", headers=other_header)
        assert resp.status_code == 404

    def test_list_shows_only_own_tenant(self, client, auth_header, tmp_upload_dir, csv_file):
        client.post(
            f"{UPLOAD_PREFIX}/upload",
            headers=auth_header,
            files={"file": csv_file},
            data={"name": "My DS"},
        )

        other_tenant_data = {
            "email": "other2@datapilot.fr",
            "password": "Other1234!",
            "tenant_id": str(uuid.uuid4()),
        }
        client.post("/api/v1/auth/register", json=other_tenant_data)
        login_resp = client.post("/api/v1/auth/login", json={
            "email": other_tenant_data["email"],
            "password": other_tenant_data["password"],
        })
        other_header = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        resp = client.get(f"{UPLOAD_PREFIX}/", headers=other_header)
        assert resp.status_code == 200
        assert len(resp.json()) == 0
