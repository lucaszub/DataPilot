---
name: api-call
description: Implements API calls to DataPilot backend following the centralized client pattern. Use when adding new API calls, hooks, or data fetching logic that communicates with the FastAPI backend.
allowed-tools: Read, Grep
---

# API Call — DataPilot

## Règle fondamentale
TOUS les appels API passent par `src/lib/api.ts` — jamais de `fetch()` direct dans un composant.

## Structure de `lib/api.ts`
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  })

  if (res.status === 401) {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  }

  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  dataSources: {
    list: () => request<DataSource[]>('/data-sources'),
    create: (data: CreateDataSourceDto) => request('/data-sources', { method: 'POST', body: JSON.stringify(data) }),
  },
  ai: {
    query: (question: string, dataSourceId: string) =>
      request<AiQueryResult>('/ai/query', { method: 'POST', body: JSON.stringify({ question, data_source_id: dataSourceId }) }),
  },
}
```

## Pattern hook SWR
```typescript
// src/hooks/useDataSources.ts
import useSWR from 'swr'
import { api } from '@/lib/api'

export function useDataSources() {
  return useSWR('/data-sources', () => api.dataSources.list(), {
    onError: (err) => console.error('DataSources fetch error:', err),
  })
}
```

## Endpoints disponibles (backend FastAPI)
- `/auth/login` POST → `{ access_token, refresh_token }`
- `/auth/register` POST
- `/data-sources` GET / POST
- `/data-sources/{id}` GET / PUT / DELETE
- `/dashboards` GET / POST
- `/dashboards/{id}` GET / PUT / DELETE
- `/ai/query` POST → `{ sql, data, columns, chart_type }`

## Checklist
- [ ] Passe par `lib/api.ts` — pas de fetch direct
- [ ] Types de retour définis dans `src/types/api.ts`
- [ ] Gestion du 401 (déjà dans `request()`)
- [ ] Hook SWR si données reactives
