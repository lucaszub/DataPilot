---
name: chart-component
description: Creates Recharts visualization components for DataPilot dashboards. Use when implementing bar charts, line charts, pie charts, or data tables from AI query results.
---

# Chart Component — DataPilot

## Principe architectural
Les charts Recharts sont TOUJOURS wrappés dans `src/components/charts/`.
Jamais importer Recharts directement dans une page ou composant feature.

## Types de charts disponibles
- `BarChartWrapper` — comparaisons, distributions
- `LineChartWrapper` — tendances temporelles
- `PieChartWrapper` — répartitions proportionnelles
- `TableView` — données tabulaires brutes

## Template wrapper
```tsx
// src/components/charts/BarChartWrapper.tsx
"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface BarChartWrapperProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  title?: string
  color?: string
}

export const BarChartWrapper = ({
  data, xKey, yKey, title, color = '#4f46e5'
}: BarChartWrapperProps) => {
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## Détection du type de chart
Le résultat du text-to-SQL détermine le chart à afficher :
```typescript
function detectChartType(columns: string[], data: unknown[]): ChartType {
  const hasDate = columns.some(c => c.includes('date') || c.includes('time'))
  const hasCategory = columns.some(c => c.includes('name') || c.includes('label'))
  if (hasDate) return 'line'
  if (hasCategory && data.length <= 10) return 'bar'
  return 'table'
}
```

## Checklist
- [ ] Wrapper dans `components/charts/` — pas de Recharts direct
- [ ] `ResponsiveContainer` toujours présent
- [ ] `"use client"` obligatoire (Recharts est client-side)
- [ ] Props typées
- [ ] Fallback si `data` est vide
