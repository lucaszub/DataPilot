# DataPilot Backend — Contexte Claude Code

## Stack
- Python 3.12 + FastAPI
- PostgreSQL 16 via SQLAlchemy 2.0 (async)
- Alembic pour les migrations
- JWT auth avec python-jose + passlib[bcrypt]
- Claude API (anthropic SDK) pour text-to-SQL
- DuckDB pour les requêtes sur fichiers CSV
- Pydantic v2 pour la validation

## Structure
```
backend/
├── app/
│   ├── main.py            ← Entrypoint FastAPI, CORS, router includes
│   ├── config.py          ← Settings via pydantic-settings (env vars)
│   ├── database.py        ← Engine + SessionLocal + Base
│   ├── models/            ← SQLAlchemy ORM models
│   ├── schemas/           ← Pydantic request/response schemas
│   ├── routers/           ← FastAPI routers (un fichier par domaine)
│   ├── services/          ← Business logic (jamais d'accès HTTP ici)
│   ├── core/
│   │   ├── security.py    ← JWT create/decode, password hashing
│   │   └── dependencies.py ← get_db, get_current_user
│   └── migrations/        ← Alembic migrations
├── requirements.txt
├── Dockerfile
└── alembic.ini
```

## Conventions
- Type hints sur toutes les fonctions
- Docstrings sur les services (pas les routers)
- snake_case partout
- Toujours filtrer par tenant_id (multi-tenant)
- Ne jamais exposer hashed_password dans les réponses API
- Utiliser Depends() pour l'injection de dépendances
- Exceptions : lever HTTPException dans les routers, pas dans les services

## Patterns
- Router → Service → Model (jamais de logique métier dans les routers)
- Tous les endpoints sous /api/v1/
- Pagination : ?skip=0&limit=20 par défaut
- Réponses : toujours des Pydantic schemas, jamais des dicts bruts

## Tests
- pytest + httpx (AsyncClient)
- Fixtures dans conftest.py
- Base de test séparée (test_datapilot)
