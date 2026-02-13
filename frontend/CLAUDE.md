# DataPilot Frontend — Contexte Claude Code

## Stack
- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS
- Recharts pour les graphiques
- Fetch API pour les appels backend

## Structure
```
frontend/src/
├── app/                    ← Next.js App Router
│   ├── (auth)/             ← Route group auth (layout sans sidebar)
│   │   ├── login/
│   │   └── register/
│   └── (app)/              ← Route group app (layout avec sidebar)
│       ├── dashboard/
│       ├── sources/
│       └── chat/           ← Interface text-to-SQL
├── components/
│   ├── ui/                 ← Composants réutilisables (Button, Input, Card...)
│   ├── charts/             ← Wrappers Recharts
│   └── layout/             ← Header, Sidebar, Footer
├── lib/
│   ├── api.ts              ← Client API (fetch wrapper avec auth)
│   └── auth.ts             ← Gestion tokens JWT côté client
└── types/                  ← Types TypeScript partagés
```

## Conventions
- PascalCase pour les composants
- camelCase pour les variables et fonctions
- Composants dans des fichiers séparés (un composant par fichier)
- "use client" uniquement quand nécessaire (interactivité)
- Server Components par défaut
- Tailwind : pas de CSS custom sauf cas exceptionnel

## API
- Base URL : NEXT_PUBLIC_API_URL (env var)
- Toutes les requêtes via lib/api.ts (gestion automatique du token)
- Token JWT stocké en localStorage (access) + httpOnly cookie (refresh)

## Design
- Palette : bleu DataPilot (#2563EB primary)
- Dark mode prévu (Phase 2)
- Responsive : mobile-first
- Composants UI inspirés de shadcn/ui
