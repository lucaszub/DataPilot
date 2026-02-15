# DataPilot

SaaS BI conversationnel pour PME françaises (50-2000 salariés).
Alternative française à Omni Analytics — hébergement souverain OVH.

## Stack
- Backend : Python 3.12 + FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 16
- Frontend : Next.js 15 + React 18 + TypeScript + Tailwind + shadcn/ui
- AI : Claude API (text-to-SQL) + DuckDB (query engine CSV)
- Infra : Docker Compose (backend, frontend, postgres, nginx) sur VPS OVH

## Commandes
```bash
docker compose up -d                              # Lancer tout
docker compose logs -f backend                    # Logs backend
docker compose exec backend pytest tests/ -v      # Tests backend
docker compose exec backend alembic upgrade head  # Migrations
cd frontend && npm run dev                        # Dev frontend
cd frontend && npm test                           # Tests frontend
```

## Règle critique
Multi-tenant : TOUTE requête DB DOIT filtrer par `tenant_id`. Aucune exception.

## Phase actuelle : Phase 1 — MVP
Focus : text-to-SQL + connecteurs PostgreSQL/MySQL/CSV + dashboards basiques.
Voir BACKLOG.md pour le détail des tâches et sprints.

## Endpoints API — Préfixe /api/v1/
- /auth → login, register, refresh
- /workspaces → CRUD workspaces
- /data-sources → connexions DB/CSV
- /dashboards → CRUD dashboards + widgets
- /ai/query → text-to-SQL
