---
paths:
  - "backend/app/models/**"
  - "backend/alembic/**"
---

# Conventions Database — DataPilot

## SQLAlchemy 2.0
- Utiliser le style 2.0 (select(), Session.execute())
- Modèles dans `backend/app/models/`

## Migrations Alembic
- TOUJOURS implémenter `downgrade()`
- Vérifier que `tenant_id` est présent sur toute nouvelle table
- Ne jamais modifier les tables manuellement — toujours via Alembic
- Commande : `docker compose exec backend alembic revision --autogenerate -m "description"`

## Modèle de données principal
- users (id, email, hashed_password, tenant_id, role)
- workspaces (id, tenant_id, name, settings)
- data_sources (id, tenant_id, type, connection_config_encrypted)
- dashboards (id, tenant_id, workspace_id, name, layout_json)
- widgets (id, dashboard_id, query_json, chart_type, position)
- semantic_layers (id, data_source_id, definitions_json)

## Chiffrement
- Credentials de connexion chiffrés avec Fernet (`connection_config_encrypted`)
