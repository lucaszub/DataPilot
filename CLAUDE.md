# DataPilot — Contexte Projet pour Claude Code

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
| UI Components | shadcn/ui (primitives manuels) + CVA + Radix UI |
| Forms | React Hook Form + Zod |
| Data fetching | SWR |
| Charts | Recharts |
| Reverse proxy | Nginx + Certbot |

## Conventions de code
- Python : snake_case, type hints partout, docstrings sur les services
- TypeScript : PascalCase composants, camelCase variables
- TOUJOURS filtrer par tenant_id dans les queries (multi-tenant critique)
- Variables d'env : toujours via app/config.py (pydantic-settings)
- Migrations : toujours via Alembic, jamais modifier les tables manuellement

## Frontend — Structure & Patterns
- Composants UI : `frontend/src/components/ui/` (shadcn primitives : Button, Input, Label, Alert)
- Contexts : `frontend/src/contexts/` (AuthContext pour login/register/logout)
- Lib : `frontend/src/lib/` (api.ts client HTTP, auth.ts helpers JWT, utils.ts cn() helper)
- Tests : `frontend/src/__tests__/` (Jest + React Testing Library)
- Middleware : `frontend/src/middleware.ts` (protection routes via cookie `dp_token`)
- Auth cookie : `dp_token` en cookie + localStorage (middleware Next.js ne peut pas lire localStorage)
- API client : refresh token rotation avec pattern isRefreshing + subscribers queue

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

## Pratiques de documentation

**Règle : chaque tâche terminée = doc à jour.** Une tâche n'est pas terminée tant que la doc concernée n'a pas été mise à jour.

### Principes
- **Concis mais précis** : aller droit au but, pas de prose inutile. Un dev doit comprendre en 30 secondes.
- **Ne documenter que ce qui existe** : pas de spéculations, pas de TODO vagues. Si c'est pas implémenté, c'est pas dans la doc.
- **Un seul endroit par sujet** : éviter les doublons entre fichiers. Si l'info existe déjà, mettre à jour plutôt que réécrire ailleurs.

### Quoi mettre à jour et quand

| Changement | Fichier(s) à mettre à jour |
|---|---|
| Nouvel endpoint ou modification API | `docs/api/<domaine>.md` — endpoint, méthode, curl exemple, réponse JSON, codes erreur |
| Nouveau modèle ou migration | `CLAUDE.md` § Modèle de données + `BACKLOG.md` (marquer la tâche completed) |
| Nouveau composant frontend ou page | `CLAUDE.md` § Frontend — Structure & Patterns (si pattern nouveau) |
| Décision d'architecture | `CLAUDE.md` section concernée (stack, sécurité, conventions) |
| Tâche terminée (toute tâche) | `BACKLOG.md` — passer le status à `completed` |

### Format docs API (`docs/api/`)
- Endpoint, méthode HTTP, description en une ligne
- Curl d'exemple avec réponse JSON type
- Codes d'erreur possibles
- Quick Test Flow (register → login → utiliser l'endpoint)

### Ce qu'il ne faut PAS faire
- Pas de paragraphes d'explication quand une liste suffit
- Pas de doc sur du code évident (un GET /items qui retourne des items n'a pas besoin de 10 lignes)
- Pas de duplication : si `CLAUDE.md` décrit déjà l'archi, ne pas la réécrire dans un autre fichier

## Phase actuelle : Phase 1 — MVP
Focus : text-to-SQL + connecteurs PostgreSQL/MySQL/CSV + dashboards basiques
NE PAS implémenter encore : connecteurs Sage/Cegid, embedded analytics, marketplace
