---
name: react-component
description: Creates React components following DataPilot conventions with TypeScript, Tailwind CSS, and proper prop typing. Use when creating new reusable UI components, feature components, or layout components.
---

# React Component — DataPilot Conventions

## Structure obligatoire
- `ui/` → primitives sans logique métier (Button, Card, Input, Badge)
- `features/` → composants avec logique DataPilot (DataSourceCard, ChatMessage)
- `layout/` → structure de page (Sidebar, Navbar, PageHeader)
- `charts/` → wrappers Recharts uniquement

## Template composant
```tsx
import { type FC } from 'react'

interface DataSourceCardProps {
  name: string
  type: 'postgresql' | 'mysql' | 'csv'
  isConnected: boolean
  onConnect: () => void
}

export const DataSourceCard: FC<DataSourceCardProps> = ({
  name,
  type,
  isConnected,
  onConnect,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500">{type}</p>
      <button
        onClick={onConnect}
        className="mt-2 btn-primary"
        disabled={isConnected}
      >
        {isConnected ? 'Connecté' : 'Connecter'}
      </button>
    </div>
  )
}
```

## Règles Tailwind
- Utiliser les classes utilitaires Tailwind — pas de CSS custom
- Couleur principale DataPilot : `indigo-600`
- Classes réutilisables définies dans `globals.css` : `.btn-primary`, `.btn-secondary`, `.card`

## Checklist
- [ ] Interface TypeScript pour les props
- [ ] Pas de `any`
- [ ] Export nommé (pas default sauf pour les pages)
- [ ] Pas de fetch direct — données en props ou via hook
