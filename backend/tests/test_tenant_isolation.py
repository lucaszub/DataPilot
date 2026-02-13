"""Tests for BaseTenantService — validates multi-tenant data isolation."""

import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy import String, Uuid, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.services.base_service import BaseTenantService

TENANT_A = uuid.uuid4()
TENANT_B = uuid.uuid4()


# ---------------------------------------------------------------------------
# Test-only model (uses generic Uuid so it works with SQLite in-memory)
# ---------------------------------------------------------------------------
class _Base(DeclarativeBase):
    pass


class Item(_Base):
    __tablename__ = "items"
    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    _Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
class TestTenantIsolation:
    def test_rejects_missing_tenant_id(self, db_session):
        with pytest.raises(HTTPException) as exc:
            BaseTenantService(Item, db_session, None)
        assert exc.value.status_code == 403

    def test_create_injects_tenant_id(self, db_session):
        svc = BaseTenantService(Item, db_session, TENANT_A)
        item = svc.create(name="Widget")
        assert item.tenant_id == TENANT_A
        assert item.name == "Widget"

    def test_get_all_returns_only_own_tenant(self, db_session):
        svc_a = BaseTenantService(Item, db_session, TENANT_A)
        svc_b = BaseTenantService(Item, db_session, TENANT_B)
        svc_a.create(name="A-item")
        svc_b.create(name="B-item")

        assert len(svc_a.get_all()) == 1
        assert svc_a.get_all()[0].name == "A-item"
        assert len(svc_b.get_all()) == 1
        assert svc_b.get_all()[0].name == "B-item"

    def test_get_by_id_cross_tenant_raises_404(self, db_session):
        svc_a = BaseTenantService(Item, db_session, TENANT_A)
        svc_b = BaseTenantService(Item, db_session, TENANT_B)
        item_a = svc_a.create(name="Secret")

        with pytest.raises(HTTPException) as exc:
            svc_b.get_by_id(item_a.id)
        assert exc.value.status_code == 404

    def test_update_cross_tenant_raises_404(self, db_session):
        svc_a = BaseTenantService(Item, db_session, TENANT_A)
        svc_b = BaseTenantService(Item, db_session, TENANT_B)
        item_a = svc_a.create(name="Original")

        with pytest.raises(HTTPException) as exc:
            svc_b.update(item_a.id, name="Hacked")
        assert exc.value.status_code == 404

    def test_delete_cross_tenant_raises_404(self, db_session):
        svc_a = BaseTenantService(Item, db_session, TENANT_A)
        svc_b = BaseTenantService(Item, db_session, TENANT_B)
        item_a = svc_a.create(name="Protected")

        with pytest.raises(HTTPException) as exc:
            svc_b.delete(item_a.id)
        assert exc.value.status_code == 404

        # Item still exists for its own tenant
        assert svc_a.get_by_id(item_a.id).name == "Protected"

    def test_update_modifies_fields(self, db_session):
        svc = BaseTenantService(Item, db_session, TENANT_A)
        item = svc.create(name="Before")
        updated = svc.update(item.id, name="After")
        assert updated.name == "After"

    def test_delete_removes_item(self, db_session):
        svc = BaseTenantService(Item, db_session, TENANT_A)
        item = svc.create(name="Deleteme")
        svc.delete(item.id)

        with pytest.raises(HTTPException) as exc:
            svc.get_by_id(item.id)
        assert exc.value.status_code == 404

    def test_get_all_pagination(self, db_session):
        svc = BaseTenantService(Item, db_session, TENANT_A)
        for i in range(5):
            svc.create(name=f"Item {i}")

        page = svc.get_all(skip=2, limit=2)
        assert len(page) == 2
