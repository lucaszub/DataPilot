---
paths:
  - "backend/app/routers/**"
  - "backend/app/services/**"
  - "backend/app/schemas/**"
---

# Conventions FastAPI — DataPilot

## Architecture en couches
Router → Service → Model (jamais de logique métier dans les routers)

## Patterns obligatoires
- `Depends()` pour l'injection de dépendances (DB session, current_user)
- `get_current_user` dependency pour tous les endpoints authentifiés
- Pydantic schemas pour input/output (pas de dict bruts)
- HTTP status codes corrects : 201 création, 404 not found, 403 forbidden
- Ne jamais exposer les erreurs internes au client

## Sécurité
- JWT : 30min access token, 7 jours refresh token
- CORS : whitelist explicite, pas de wildcard en prod
- Toutes les queries SQL user-generated passent par QueryService (sanitization)
