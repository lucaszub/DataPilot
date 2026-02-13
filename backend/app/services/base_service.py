"""Base tenant-scoped service — enforces multi-tenant isolation on all CRUD operations."""

import uuid
from typing import Generic, TypeVar, Type

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseTenantService(Generic[ModelType]):
    """Generic CRUD service that enforces tenant_id filtering on every query.

    Usage in a router:
        service = BaseTenantService(Workspace, db, current_user.tenant_id)
        workspaces = service.get_all()
    """

    def __init__(self, model: Type[ModelType], db: Session, tenant_id: uuid.UUID):
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="tenant_id is required",
            )
        self.model = model
        self.db = db
        self.tenant_id = tenant_id

    def _base_query(self):
        return self.db.query(self.model).filter(
            self.model.tenant_id == self.tenant_id
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        return self._base_query().offset(skip).limit(limit).all()

    def get_by_id(self, id: uuid.UUID) -> ModelType:
        obj = self._base_query().filter(self.model.id == id).first()
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.model.__tablename__} not found",
            )
        return obj

    def create(self, **kwargs) -> ModelType:
        obj = self.model(tenant_id=self.tenant_id, **kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, id: uuid.UUID, **kwargs) -> ModelType:
        obj = self.get_by_id(id)
        for key, value in kwargs.items():
            setattr(obj, key, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, id: uuid.UUID) -> ModelType:
        obj = self.get_by_id(id)
        self.db.delete(obj)
        self.db.commit()
        return obj
