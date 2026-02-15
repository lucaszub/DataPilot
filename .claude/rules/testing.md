---
paths:
  - "backend/tests/**"
  - "frontend/src/__tests__/**"
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/test_*"
---

# Conventions de test — DataPilot

## Backend (pytest)
- Fichiers dans `backend/tests/`
- Nommage : `test_<module>.py`
- Fixtures pour DB session, test client, auth tokens
- Toujours tester les cas d'erreur (401, 403, 404, 422)
- Vérifier l'isolation multi-tenant dans chaque test d'endpoint

## Frontend (Jest + React Testing Library)
- Fichiers dans `frontend/src/__tests__/`
- Nommage : `<Component>.test.tsx`
- Tester le comportement utilisateur, pas l'implémentation
- Mocker les appels API (pas d'appels réels en test)
- Utiliser `screen.getByRole` plutôt que `getByTestId`

## Exécution
- Backend : `docker compose exec backend pytest tests/ -v`
- Frontend : `cd frontend && npm test`
