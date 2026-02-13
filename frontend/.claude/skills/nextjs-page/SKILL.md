---
name: nextjs-page
description: Creates Next.js 15 pages following DataPilot App Router conventions. Use when creating new routes, pages, or layouts in the frontend src/app directory.
---

# Next.js Page — DataPilot Conventions

## Règles App Router
- Toujours utiliser App Router — JAMAIS Pages Router
- Pages dans `src/app/(app)/<feature>/page.tsx` (protégées) ou `(auth)/<feature>/page.tsx` (publiques)
- Server Component par défaut — ajouter `"use client"` uniquement si state/events
- Layout partagé dans `layout.tsx` du groupe parent

## Template page protégée (Server Component)
```tsx
// src/app/(app)/sources/page.tsx
import { PageHeader } from '@/components/layout/PageHeader'
import { DataSourceList } from '@/components/features/DataSourceList'

export default async function SourcesPage() {
  return (
    <div className="p-6">
      <PageHeader title="Sources de données" />
      <DataSourceList />
    </div>
  )
}

export const metadata = {
  title: 'Sources — DataPilot',
}
```

## Template page avec état client
```tsx
"use client"

import { useState } from 'react'
import { useDataSources } from '@/hooks/useDataSources'

export default function SourcesPage() {
  const { data, isLoading, error } = useDataSources()

  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur : {error.message}</div>

  // ...
}
```

## Checklist avant de valider
- [ ] Server Component si pas de state/events
- [ ] `metadata` exporté pour le SEO
- [ ] Gestion loading + error state
- [ ] Route enregistrée dans le bon groupe `(auth)` ou `(app)`
- [ ] Protégée par middleware si dans `(app)/`
