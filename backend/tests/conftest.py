"""Shared test fixtures — in-memory SQLite database and FastAPI test client."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.core.dependencies import get_db
from app.main import app

SQLITE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# SQLite doesn't enforce FK by default — enable it
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestSession = sessionmaker(bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_db):
    session = TestSession()
    yield session
    session.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with DB overridden to use SQLite."""
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


TENANT_ID = "550e8400-e29b-41d4-a716-446655440000"

@pytest.fixture
def test_user_data():
    return {
        "email": "test@datapilot.fr",
        "password": "Test1234!",
        "tenant_id": TENANT_ID,
    }


@pytest.fixture
def registered_user(client, test_user_data):
    """Register a user and return the response data."""
    resp = client.post("/api/v1/auth/register", json=test_user_data)
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
def auth_tokens(client, test_user_data, registered_user):
    """Login and return tokens."""
    resp = client.post("/api/v1/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"],
    })
    assert resp.status_code == 200
    return resp.json()


@pytest.fixture
def auth_header(auth_tokens):
    """Authorization header ready to use."""
    return {"Authorization": f"Bearer {auth_tokens['access_token']}"}
