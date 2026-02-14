# DataPilot — Backlog & Task Tracking

> **MVP Phase 1 (CSV-first)** — Status: In Progress | Last updated: 2026-02-14

---

## Project Status Overview

| Metric | Value | Target |
|--------|-------|--------|
| Phase 1 Tasks | 35 | 100% |
| Completed | 12 | 35 |
| In Progress | 0 | — |
| Blocked | 0 | 0 |
| Completion Rate | 34% | 100% |

---

## Backlog Structure

Each task has:
- **ID**: PHASE-AREA-## (e.g., P1-CSV-01)
- **Status**: `todo` | `in_progress` | `completed` | `blocked`
- **Effort**: T-shirt sizing (XS, S, M, L)
- **Priority**: 1 (critical path) → 3 (nice-to-have)
- **Depends on**: Task IDs
- **Owner**: assignee

---

## Phase 1: MVP CSV-First

### Sprint 1: Foundation & Auth (COMPLETED)

#### Backend Infrastructure
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-BACK-01 | Setup PostgreSQL migrations base | `completed` | XS | 1 | — | PR #2 |
| P1-BACK-02 | Implement auth service (JWT) | `completed` | S | 1 | P1-BACK-01 | PR #11 |
| P1-BACK-03 | Implement auth routes (/login, /register, /refresh) | `completed` | S | 1 | P1-BACK-02 | PR #11 |
| P1-BACK-04 | Add auth tests | `completed` | S | 2 | P1-BACK-03 | PR #11 — 14 test cases |
| P1-CORE-01 | Multi-tenant isolation (BaseTenantService) | `completed` | M | 1 | P1-BACK-01 | PR #12 — 9 tests |

#### Frontend Auth
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-FRONT-01 | Login page | `completed` | S | 1 | — | shadcn/ui + Zod |
| P1-FRONT-02 | Register page | `completed` | S | 1 | P1-FRONT-01 | password strength + confirmPassword |
| P1-FRONT-03 | Auth middleware & protected routes | `completed` | XS | 1 | P1-FRONT-01 | cookie dp_token |
| P1-FRONT-04 | API client setup (lib/api.ts) | `completed` | S | 1 | — | JWT refresh rotation |

---

### Sprint 2: CSV Upload & Preview (Week 3-4)

#### Backend CSV Service
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-CSV-01 | CSV upload service | `completed` | M | 1 | P1-CORE-01 | FastAPI UploadFile, filesystem storage /var/datapilot/uploads/{tenant_id}/{ds_id}/, parquet conversion via DuckDB |
| P1-CSV-02 | Schema inference via DuckDB | `completed` | S | 1 | P1-CSV-01 | Detect column names, types, sample rows (first 100), row count |
| P1-CSV-03 | Data sources CRUD routes (CSV only) | `completed` | M | 1 | P1-CSV-02 | POST upload, GET list, GET by id, DELETE (+ cleanup file), GET preview (paginated rows) |

#### Frontend CSV Upload
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-CSV-04 | App sidebar layout | `todo` | M | 1 | P1-FRONT-04 | Navigation sidebar: Sources, Model, Explore, Dashboards, Settings. User menu + logout |
| P1-CSV-05 | CSV upload page (drag & drop) | `todo` | M | 1 | P1-CSV-04 | react-dropzone, multi-file upload, progress bar, file type validation (.csv) |
| P1-CSV-06 | Data sources list page | `todo` | S | 1 | P1-CSV-05 | Cards with name, row count, column count, upload date. Delete action |
| P1-CSV-07 | Schema preview & data table | `todo` | S | 1 | P1-CSV-06 | Column names + inferred types, paginated data preview table |

---

### Sprint 3: Semantic Model (Week 5-6)

#### Backend Semantic Layer
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-SEM-01 | Semantic layer CRUD routes | `todo` | S | 1 | P1-CSV-03 | Save/load definitions_json (nodes, edges, column roles). One semantic layer per workspace |
| P1-SEM-02 | SemanticQueryBuilder (DuckDB cross-CSV) | `todo` | L | 1 | P1-SEM-01 | Create DuckDB views from CSV files, apply JOINs from edges, execute queries in semantic context |

#### Frontend ERD Editor (ReactFlow)
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-SEM-03 | ERD canvas with ReactFlow | `todo` | L | 1 | P1-CSV-07 | TableNode custom component (name, columns list), drag to position, zoom/pan |
| P1-SEM-04 | Edge builder (drag handle to handle) | `todo` | M | 1 | P1-SEM-03 | Connect columns between tables to define joins (LEFT/INNER). Visual edge with join type label |
| P1-SEM-05 | Column role tagger (dimension/measure) | `todo` | S | 1 | P1-SEM-03 | Click column → toggle dimension/measure/ignore. Visual indicator (D/M icon + color) |

---

### Sprint 4: AI + SQL Editor (Week 7-9)

#### Backend AI Service
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-AI-01 | LLM Provider abstraction + Claude adapter | `todo` | M | 1 | — | Abstract LLMProvider class, ClaudeProvider, OpenAIProvider. Factory pattern based on api_key config |
| P1-AI-02 | API Keys table + CRUD routes | `todo` | S | 1 | P1-CORE-01 | New table api_keys (id, tenant_id, provider, encrypted_key, model_id, is_active). Fernet encryption |
| P1-AI-03 | /ai/query endpoint (text-to-SQL) | `todo` | M | 1 | P1-AI-01, P1-SEM-02 | POST {question, workspace_id} → {sql, results, chart_suggestion, explanation}. Uses semantic context |
| P1-AI-04 | Query execution service | `todo` | M | 1 | P1-SEM-02 | Execute SQL on DuckDB semantic model, return DataFrame as JSON, sanitize user SQL |

#### Frontend AI & SQL
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-AI-05 | API Keys settings page | `todo` | S | 1 | P1-CSV-04 | Multi-provider: select provider (Claude/OpenAI), paste key, select model, validate, toggle active |
| P1-AI-06 | Chat/Explore interface | `todo` | M | 1 | P1-AI-05 | Question input, send button, loading state, AI response display (SQL + explanation) |
| P1-AI-07 | SQL editor (CodeMirror) | `todo` | M | 2 | P1-SEM-05 | CodeMirror 6 + @codemirror/lang-sql, autocompletion from semantic schema (table/column names) |
| P1-AI-08 | Query result display (table + chart) | `todo` | M | 1 | P1-AI-06 | Data table with pagination, auto chart suggestion rendering, toggle table/chart view |

---

### Sprint 5: Dashboard Builder (Week 10-12)

#### Backend Dashboards
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-DASH-01 | Dashboards + Widgets CRUD routes | `todo` | M | 1 | P1-CORE-01 | Dashboard: name, layout_json, workspace_id. Widget: query_json, chart_type, position, size |
| P1-DASH-02 | Workspaces CRUD routes | `todo` | S | 1 | P1-CORE-01 | Create/list/update/delete workspaces |

#### Frontend Dashboard Editor
| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-DASH-03 | Recharts wrapper components | `todo` | M | 1 | — | BarChart, LineChart, PieChart, AreaChart, Table wrappers in components/charts/ |
| P1-DASH-04 | Dashboard list page | `todo` | S | 1 | P1-CSV-04 | List dashboards, create new, delete, open in view/edit mode |
| P1-DASH-05 | Dashboard canvas (react-grid-layout) | `todo` | L | 1 | P1-DASH-04 | Grid layout with drag/resize widgets, save layout, responsive breakpoints |
| P1-DASH-06 | Widget creation flow | `todo` | M | 1 | P1-DASH-05, P1-AI-08 | Select measure/dimension → choose chart type → configure → add to grid |
| P1-DASH-07 | Dashboard templates (Ventes, RH) | `todo` | S | 2 | P1-DASH-06 | Pre-built layouts: Ventes (CA/mois, top produits, YoY), RH (effectifs, turnover, anciennete) |

---

### Sprint 6: Polish & Deploy (Week 13-16)

| ID | Task | Status | Effort | Priority | Depends | Notes |
|---|------|--------|--------|----------|---------|-------|
| P1-UX-01 | Workspace switcher | `todo` | XS | 2 | P1-DASH-02 | Sidebar dropdown to switch workspaces |
| P1-UX-02 | Onboarding flow (upload → model → explore) | `todo` | M | 2 | P1-DASH-06 | Guided wizard for first-time users |
| P1-TEST-01 | Backend integration tests | `todo` | M | 2 | P1-DASH-01 | Auth + CSV + AI + Dashboard flow E2E |
| P1-TEST-02 | Frontend component tests | `todo` | M | 2 | P1-DASH-06 | Jest + RTL for key components |
| P1-INFRA-01 | Docker Compose setup (local dev) | `todo` | S | 1 | — | backend, frontend, postgres, nginx |
| P1-INFRA-02 | CI/CD GitHub Actions | `todo` | M | 2 | P1-TEST-01 | Lint, test, build on PR |
| P1-INFRA-03 | Production deployment (OVH VPS) | `todo` | L | 1 | P1-INFRA-02 | SSH deploy, SSL, env vars |

---

## Dependencies Map

```
Auth (DONE) + Multi-tenant (DONE)
│
├── Sprint 2: CSV Core
│   ├── P1-CSV-01 → P1-CSV-02 → P1-CSV-03 (backend)
│   └── P1-CSV-04 → P1-CSV-05 → P1-CSV-06 → P1-CSV-07 (frontend)
│
├── Sprint 3: Semantic Model
│   ├── P1-SEM-01 → P1-SEM-02 (backend, depends on P1-CSV-03)
│   └── P1-SEM-03 → P1-SEM-04 + P1-SEM-05 (frontend, depends on P1-CSV-07)
│
├── Sprint 4: AI + SQL
│   ├── P1-AI-01 → P1-AI-03 → P1-AI-04 (backend, P1-AI-03 depends on P1-SEM-02)
│   ├── P1-AI-02 (backend, independent)
│   └── P1-AI-05 → P1-AI-06 → P1-AI-08, P1-AI-07 (frontend)
│
├── Sprint 5: Dashboards
│   ├── P1-DASH-01 + P1-DASH-02 (backend)
│   └── P1-DASH-03 → P1-DASH-04 → P1-DASH-05 → P1-DASH-06 → P1-DASH-07 (frontend)
│
└── Sprint 6: Polish + Deploy
    └── P1-UX-*, P1-TEST-*, P1-INFRA-*
```

---

## Architecture — Tech Stack MVP

| Component | Library | Rationale |
|-----------|---------|-----------|
| ERD visual editor | ReactFlow | React-native nodes/edges, drag & drop, custom TableNode |
| Dashboard grid | react-grid-layout | Standard (Grafana, Kibana), resize + responsive |
| SQL editor | CodeMirror 6 | 400kb (vs 5MB Monaco), SQL autocompletion, SSR-friendly |
| CSV upload UI | react-dropzone | Lightweight, multi-file, progress events |
| Charts | Recharts | Already planned, good React integration |
| CSV query engine | DuckDB (in-process) | Native CSV/Parquet read, cross-file JOINs |
| LLM abstraction | Custom adapter pattern | LLMProvider → ClaudeProvider / OpenAIProvider |
| CSV storage | Filesystem local | /var/datapilot/uploads/{tenant_id}/{ds_id}/ — S3 in Phase 2 |

---

## Removed from MVP (deferred to Phase 2)

| ID | Task | Reason |
|---|------|--------|
| P1-BACK-06 | PostgreSQL connector | CSV-first approach — DB connectors = Phase 2 |
| P1-BACK-07 | MySQL connector | Same as above |
| P1-FRONT-07 | PostgreSQL form | Same as above |
| P1-FRONT-08 | MySQL form | Same as above |

---

## How to Use This Backlog

### Start a task
```bash
/run-tasks P1-CSV-01
```

### Validate completion
```bash
/datapilot-taskmaster validate P1-CSV-01
```

### View project status
```bash
/datapilot-taskmaster status
```

---

**Last updated**: 2026-02-14 by @architect (Sprint 2 backend completed, frontend CSV next)
**Next milestone**: Sprint 2 — Frontend CSV (in progress) + Sprint 3 — Semantic Model
