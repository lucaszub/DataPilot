je # DataPilot — Contexte Projet pour Claude Code

## Qu'est-ce que DataPilot ?
Plateforme SaaS de Business Intelligence avec IA conversationnelle,
ciblant les PME/ETI françaises (50-2000 salariés).
Alternative française à Omni Analytics — hébergement souverain OVH, IA en français.

## Promesse produit
« Connectez vos données. Posez une question. Obtenez la réponse. »

## Architecture
- Monorepo : /backend (FastAPI) + /frontend (Next.js)
- Infra : VPS OVH Ubuntu 22.04 + Docker Compose
- 4 services Docker : backend, frontend, postgres, nginx
- Multi-tenant : isolation par tenant_id sur TOUTES les tables

## Stack Technique
| Couche | Techno |
|---|---|
| Backend | Python 3.12 + FastAPI |
| Auth | JWT custom (python-jose) |
| BDD | PostgreSQL 16 (Docker) + SQLAlchemy + Alembic |
| IA | Claude API (claude-sonnet-4-5-20250929) |
| Query engine | DuckDB (CSV) + SQLAlchemy (DB) |
| Frontend | Next.js 15 + Tailwind + TypeScript |
| Charts | Recharts |
| Reverse proxy | Nginx + Certbot |

## Conventions de code
- Python : snake_case, type hints partout, docstrings sur les services
- TypeScript : PascalCase composants, camelCase variables
- TOUJOURS filtrer par tenant_id dans les queries (multi-tenant critique)
- Variables d'env : toujours via app/config.py (pydantic-settings)
- Migrations : toujours via Alembic, jamais modifier les tables manuellement

## Endpoints API — Préfixe /api/v1/
- /auth → login, register, refresh
- /workspaces → CRUD workspaces
- /data-sources → connexions DB/CSV
- /dashboards → CRUD dashboards + widgets
- /ai/query → text-to-SQL (endpoint principal)

## Modèle de données (tables principales)
- users (id, email, hashed_password, tenant_id, role, created_at)
- workspaces (id, tenant_id, name, settings)
- data_sources (id, tenant_id, type, connection_config_encrypted, schema_cache)
- dashboards (id, tenant_id, workspace_id, name, layout_json)
- widgets (id, dashboard_id, query_json, chart_type, position)
- semantic_layers (id, data_source_id, definitions_json)

## Sécurité — Points critiques
- Toutes les queries SQL user-generated passent par QueryService (sanitization)
- Credentials de connexion chiffrés avec Fernet en base
- JWT : 30min access token, 7 jours refresh token
- CORS : whitelist explicite, pas de wildcard en prod

## Commandes utiles
```bash
docker-compose up -d
docker-compose logs -f backend
docker-compose exec backend alembic upgrade head
docker-compose exec backend pytest tests/ -v
```

## Phase actuelle : Phase 1 — MVP
Focus : text-to-SQL + connecteurs PostgreSQL/MySQL/CSV + dashboards basiques
NE PAS implémenter encore : connecteurs Sage/Cegid, embedded analytics, marketplace
