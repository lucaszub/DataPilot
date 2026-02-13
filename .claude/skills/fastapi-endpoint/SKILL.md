---
name: fastapi-endpoint
description: Creates FastAPI endpoints following DataPilot conventions. Use when creating new API routes, routers, or endpoint functions in the backend.
---

# FastAPI Endpoint — DataPilot Conventions

## Structure obligatoire

Tout endpoint doit suivre ce pattern :
1. Router dans `app/routers/<resource>.py`
2. Logique métier dans `app/services/<resource>_service.py`
3. Schemas Pydantic dans `app/schemas/<resource>.py`
4. Model SQLAlchemy dans `app/models/<resource>.py`

## Règles critiques
- TOUJOURS filtrer par `current_user.tenant_id` (multi-tenant obligatoire)
- TOUJOURS typer les paramètres et le retour
- TOUJOURS utiliser les dépendances via `app/core/dependencies.py`
- Préfixe API : `/api/v1/<resource>`

## Template endpoint
```python
@router.get("/{id}", response_model=ResourceSchema)
async def get_resource(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ResourceService(db)
    return service.get_by_id(id, tenant_id=current_user.tenant_id)
```

## Checklist avant de valider
- [ ] tenant_id filtré
- [ ] Schema Pydantic défini
- [ ] Route enregistrée dans main.py
- [ ] Test unitaire créé
