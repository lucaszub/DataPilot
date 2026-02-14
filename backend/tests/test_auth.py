"""Tests for auth endpoints — register, login, me, refresh."""


class TestRegister:
    def test_register_success(self, client, test_user_data):
        resp = client.post("/api/v1/auth/register", json=test_user_data)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == test_user_data["email"]
        assert data["tenant_id"] == test_user_data["tenant_id"]
        assert data["role"] == "user"
        assert "id" in data

    def test_register_duplicate_email(self, client, test_user_data, registered_user):
        resp = client.post("/api/v1/auth/register", json=test_user_data)
        assert resp.status_code == 409

    def test_register_invalid_email(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "Test1234!",
            "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
        })
        assert resp.status_code == 422

    def test_register_missing_fields(self, client):
        resp = client.post("/api/v1/auth/register", json={"email": "a@b.com"})
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, test_user_data, registered_user):
        resp = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user_data, registered_user):
        resp = client.post("/api/v1/auth/login", json={
            "email": test_user_data["email"],
            "password": "WrongPassword!",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "email": "ghost@datapilot.fr",
            "password": "Test1234!",
        })
        assert resp.status_code == 401


class TestMe:
    def test_me_authenticated(self, client, test_user_data, auth_header):
        resp = client.get("/api/v1/auth/me", headers=auth_header)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_user_data["email"]
        assert data["tenant_id"] == test_user_data["tenant_id"]

    def test_me_no_token(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 403

    def test_me_invalid_token(self, client):
        resp = client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer invalid-token-here"
        })
        assert resp.status_code == 401


class TestRefresh:
    def test_refresh_success(self, client, auth_tokens):
        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": auth_tokens["refresh_token"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_with_access_token_fails(self, client, auth_tokens):
        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": auth_tokens["access_token"],
        })
        assert resp.status_code == 401

    def test_refresh_invalid_token(self, client):
        resp = client.post("/api/v1/auth/refresh", json={
            "refresh_token": "garbage-token",
        })
        assert resp.status_code == 401
