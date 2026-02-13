# DataPilot — Contexte Frontend pour Claude Code

## Rôle de ce dossier
Interface web SaaS de DataPilot — application Next.js 15 qui consomme le backend FastAPI.

## Architecture frontend
```
frontend/src/
├── app/                         ← Next.js 15 App Router
│   ├── (auth)/                  ← Groupe de routes non-protégées
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (app)/                   ← Groupe protégé (middleware auth)
│       ├── layout.tsx           ← Layout avec sidebar
│       ├── dashboard/
│       │   └── [id]/page.tsx
│       ├── sources/
│       │   └── page.tsx
│       └── chat/                ← Interface text-to-SQL
│           └── page.tsx
├── components/
│   ├── ui/                      ← Primitives réutilisables (Button, Input, Card)
│   ├── charts/                  ← Wrappers Recharts (BarChart, LineChart, etc.)
│   │   ├── BarChartWrapper.tsx
│   │   ├── LineChartWrapper.tsx
│   │   └── TableView.tsx
│   ├── layout/                  ← Sidebar, Navbar, PageHeader
│   └── features/                ← Composants métier (DataSourceCard, ChatMessage)
├── lib/
│   ├── api.ts                   ← Client HTTP centralisé
│   ├── auth.ts                  ← Helpers JWT / session
│   └── utils.ts
├── types/
│   ├── api.ts                   ← Types des réponses backend
│   └── charts.ts
└── middleware.ts                 ← Protection des routes (auth)
```

## Stack
- Next.js 15 (App Router, pas Pages Router)
- TypeScript strict
- Tailwind CSS v3
- Recharts (graphiques)
- SWR (data fetching / cache)
- React Hook Form + Zod (formulaires)

## Backend API
- URL locale : `http://localhost:8000`
- URL prod : `https://api.datapilot.fr`
- Variable d'env : `NEXT_PUBLIC_API_URL`
- Tous les endpoints : `/api/v1/<resource>`
- Auth : Bearer JWT dans le header `Authorization`

## Conventions de code

### Nommage
- Composants : PascalCase → `DataSourceCard.tsx`
- Hooks custom : camelCase avec préfixe `use` → `useDataSources.ts`
- Types : PascalCase → `interface DashboardProps {}`
- Variables / fonctions : camelCase
- Constantes globales : SCREAMING_SNAKE → `API_BASE_URL`

### Composants
- Toujours typer les props avec une interface
- Server Components par défaut, `"use client"` uniquement si nécessaire
- Pas de `any` TypeScript — utiliser les types de `src/types/api.ts`

### API calls
- TOUJOURS passer par `lib/api.ts` — jamais de fetch direct dans un composant
- TOUJOURS gérer les erreurs (try/catch ou SWR onError)
- TOUJOURS inclure le JWT dans les headers via `getAuthHeaders()`

### Auth
- JWT stocké en `localStorage` (MVP — migrer vers httpOnly cookie en Phase 2)
- Middleware `src/middleware.ts` protège le groupe `(app)/`
- Si 401 → rediriger vers `/login`

## Points critiques
- Ne jamais exposer l'`ANTHROPIC_API_KEY` côté frontend
- Valider les données avec Zod avant soumission des formulaires
- Les charts Recharts sont tous wrappés dans `components/charts/` — ne pas utiliser Recharts directement dans les pages

## Commandes
```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Phase actuelle : Phase 1 MVP
Focus : login/register, liste sources de données, éditeur de dashboard basique, interface chat text-to-SQL.
NE PAS implémenter : embedded analytics, export PDF, marketplace de templates.
