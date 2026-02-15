# DataPilot — Plan de developpement

> Branche mockup: `mockup/omni-ui` (pousse le 2026-02-15)

---

## Ce qui est fait (mockup frontend)

| Feature | Status | Fichiers cles |
|---------|--------|---------------|
| Explorer sidebar (tables + champs) | OK | `EnhancedFieldPicker.tsx` |
| Drag & drop dimensions/mesures | OK | `FieldDropZones.tsx` |
| Auto-execute quand champs changent | OK | `ExplorerContext.tsx` |
| SQL generation depuis visual builder | OK | `ExplorerContext.tsx` (generateSqlFromState) |
| SQL Preview panel (highlight, edit, copy) | OK | `SqlPreviewPanel.tsx` |
| Menu contextuel colonnes (tri, filtre, calc) | OK | `ColumnActionsMenu.tsx` |
| Quick calc (% total, cumul, rang...) | OK | `ExplorerContext.tsx` |
| Colonnes calculees (modal + formules) | OK | `AddCalculatedColumnModal.tsx` |
| Export CSV (FR + international) | OK | `ExportButton.tsx` |
| Dashboard builder (grid + widgets) | OK | `components/features/dashboard/` |
| Chat IA mockup | OK | `chat/page.tsx` |
| Mock data (clients, produits, commandes) | OK | `lib/mock-data/` |

---

## Sprint 3 — Explorer avance (frontend)

### 3.1 Agregations sur dimensions
- Ajouter `COUNT()`, `COUNT DISTINCT` dans le dropdown des dimensions
- Quand une dimension a un COUNT, elle passe en mesure dans le SQL
- UI: badge "Count" sur la dimension dans FieldDropZones

### 3.2 Graphiques dans l'Explorer
- Ajouter toggle Table/Chart dans ExplorerToolbar
- Types: Bar, Line, Pie (Recharts, deja installe)
- Auto-detection du type de chart selon les champs:
  - 1 dimension + 1 mesure = Bar
  - 1 dimension date + mesures = Line
  - 1 dimension + 1 mesure (peu de valeurs) = Pie
- Composant `ExplorerChart.tsx` (existe deja, a enrichir)

### 3.3 Mode calcul Excel/SQL
Petit panneau lateral (drawer) avec 2 onglets:
1. **Spreadsheet** — formules type Excel (`=A1-B1`, `=SUM(A:A)`)
2. **SQL** — expression SQL libre (deja fait via custom calc)

---

## Sprint 4 — Backend (connecter le vrai moteur)

### 4.1 API Explorer
```
POST /api/v1/explorer/query
Body: { data_source_id, fields[], filters[], sorts[], limit, calculated_columns[] }
Response: { columns[], rows[], sql, execution_time_ms }
```
- Le backend recoit la config visuelle et genere le SQL via DuckDB
- Remplacer le mock `query-engine.ts` par des appels API reels

### 4.2 Semantic Layer backend
```
GET  /api/v1/data-sources/:id/schema   → colonnes, types, relations
POST /api/v1/semantic-layers           → sauvegarder le modele
```
- Schema inference depuis les parquet existants
- Relations entre tables (FK detection ou config manuelle)

### 4.3 Saved Queries
```
POST /api/v1/saved-queries             → sauvegarder une requete
GET  /api/v1/saved-queries             → lister
GET  /api/v1/saved-queries/:id/run     → re-executer
```

### 4.4 DuckDB Query Service
- `ExplorerQueryService` dans `app/services/`
- Recoit les champs, genere le SQL, execute via DuckDB
- Gere les JOINs multi-CSV via les vues DuckDB existantes
- Applique les colonnes calculees cote serveur (window functions)

---

## Sprint 5 — Dashboard connecte

### 5.1 Backend dashboards
```
POST /api/v1/dashboards                → creer
PUT  /api/v1/dashboards/:id            → update layout
POST /api/v1/dashboards/:id/widgets    → ajouter widget
```
- Widget = saved_query_id + chart_type + position

### 5.2 Frontend integration
- Remplacer les mock dashboards par des vrais
- Chaque widget execute sa saved_query via l'API
- Filtres globaux appliques a tous les widgets configures

---

## Sprint 6 — Langage naturel + Chat IA (text-to-SQL)

> Prerequis: Sprints 4+5 termines (backend fonctionnel, donnees reelles)

### 6.1 Calcul en langage naturel (Explorer)
- Ajout d'un 3e onglet "IA" dans le panneau calcul (Sprint 3.3)
- Champ texte: "Calcule la marge en %" → genere l'expression SQL
- Necessite le backend IA pour fonctionner

### 6.2 Chat IA (page dediee)
```
POST /api/v1/ai/query
Body: { question, data_source_id, conversation_history[] }
Response: { sql, explanation, results }
```
- Prompt engineering avec schema + semantic layer en contexte
- Multi-provider (Claude / OpenAI) via `LLMProvider` abstraction
- Remplacer le mock chat par des vrais appels
- Afficher resultats inline (tableau + chart)
- Bouton "Envoyer vers Explorer" pour affiner la requete

---

## Priorites

```
Sprint 3 (Explorer frontend)  ← NEXT
  └─ 3.1 COUNT sur dimensions
  └─ 3.2 Graphiques Explorer
  └─ 3.3 Mode calcul Excel/SQL

Sprint 4 (Backend)
  └─ 4.1 API Explorer
  └─ 4.2 Semantic Layer
  └─ 4.3 Saved Queries
  └─ 4.4 DuckDB Service

Sprint 5 (Dashboard)
  └─ 5.1 Backend dashboards
  └─ 5.2 Frontend integration

Sprint 6 (Langage naturel + Chat IA)  ← DERNIER
  └─ 6.1 Calcul IA dans Explorer
  └─ 6.2 Chat text-to-SQL
  ⚠️  Necessite backend + donnees reelles (Sprints 4+5)
```

---

## Stack rappel

| Composant | Lib |
|-----------|-----|
| Tables | TanStack Table |
| Charts | Recharts |
| SQL editor | CodeMirror 6 (a installer sprint 3.3 si besoin) |
| Grid dashboard | react-grid-layout |
| Query engine | DuckDB (backend) |
| IA | Claude API / OpenAI |
