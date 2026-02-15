---
paths:
  - "backend/**/*.py"
---

# Conventions Python — DataPilot Backend

- `snake_case` pour fonctions et variables
- Type hints partout (paramètres + retour)
- Docstrings sur les fonctions de service (pas sur les routers)
- Variables d'env via `app/config.py` (pydantic-settings), jamais de hardcode
- Ne JAMAIS exposer `hashed_password` dans les réponses API
- Imports triés : stdlib → third-party → local
