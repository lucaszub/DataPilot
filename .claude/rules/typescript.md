---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.tsx"
---

# Conventions TypeScript — DataPilot Frontend

- `PascalCase` pour les composants React
- `camelCase` pour variables et fonctions
- TypeScript strict mode — pas de `any`
- Pas de `eslint-disable` sans justification écrite
- Ne jamais hardcoder d'URL API — utiliser les variables d'env
- Auth cookie : `dp_token` en cookie + localStorage
- API client dans `frontend/src/lib/api.ts` (refresh token rotation)
