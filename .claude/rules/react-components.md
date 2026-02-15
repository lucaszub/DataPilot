---
paths:
  - "frontend/src/components/**"
  - "frontend/src/app/**"
  - "frontend/src/contexts/**"
---

# Conventions React — DataPilot Frontend

## Structure
- Composants UI : `frontend/src/components/ui/` (shadcn primitives)
- Contexts : `frontend/src/contexts/` (AuthContext pour auth)
- Lib : `frontend/src/lib/` (api.ts, auth.ts, utils.ts)
- Middleware : `frontend/src/middleware.ts` (protection routes via cookie `dp_token`)

## Librairies UI
- shadcn/ui (Radix primitives) : Button, Input, Label, Alert, Dialog, Select, Tooltip
- CVA (class-variance-authority) + clsx + tailwind-merge pour les variants
- lucide-react pour les icônes
- react-hook-form + zod pour les formulaires
- Recharts pour les graphiques
- @xyflow/react (ReactFlow) pour l'éditeur ERD
- @tanstack/react-table pour les tables de données
- react-grid-layout pour les dashboards
- CodeMirror 6 pour l'éditeur SQL
- SWR pour le data fetching

## Patterns
- Un composant par fichier
- Extraire la logique complexe dans des custom hooks (`use` prefix)
- Semantic HTML + aria labels pour l'accessibilité
