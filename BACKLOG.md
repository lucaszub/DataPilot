# DataPilot — Backlog & Task Tracking

> **MVP Phase 1** — Mois 1–4 | Status: 🚀 In Progress | Last updated: 2026-02-13

---

## 📊 Project Status Overview

| Metric | Value | Target |
|--------|-------|--------|
| Phase 1 Tasks | 23 | 100% |
| Completed | 9 | 23 |
| In Progress | 0 | — |
| Blocked | 0 | 0 |
| Completion Rate | 39% | 100% |
| Timeline | Week 1 | Week 16 |

---

## 📋 Backlog Structure

Each task has:
- **ID**: PHASE-AREA-## (e.g., P1-BACK-01)
- **Status**: `todo` | `in_progress` | `completed` | `blocked`
- **Effort**: T-shirt sizing (XS, S, M, L)
- **Priority**: 1 (critical path) → 3 (nice-to-have)
- **Depends on**: Task IDs
- **Owner**: assignee
- **Notes**: technical details, links, blockers

---

## 🎯 Phase 1: MVP (Mois 1–4)

### Sprint 1: Foundation & Auth (Week 1–2)

#### Backend Infrastructure
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-BACK-01 | Setup PostgreSQL migrations base | `completed` ✅ 2026-02-13 | XS | 1 | Claude | — | PR #2 — 001_initial_schema.py : users, workspaces, data_sources, dashboards, widgets, semantic_layers |
| P1-BACK-02 | Implement auth service (JWT) | `completed` ✅ 2026-02-13 | S | 1 | Claude | P1-BACK-01 | PR #11 — security.py, auth_service.py, schemas/auth.py |
| P1-BACK-03 | Implement auth routes (/login, /register, /refresh) | `completed` ✅ 2026-02-13 | S | 1 | Claude | P1-BACK-02 | PR #11 — routers/auth.py, dependencies.py, /me endpoint |
| P1-BACK-04 | Add auth tests | `completed` ✅ 2026-02-13 | S | 2 | Claude | P1-BACK-03 | PR #11 — test_auth.py with pytest fixtures, AsyncClient, 14 test cases |
| P1-CORE-01 | Add multi-tenant isolation (QueryService base) | `completed` ✅ 2026-02-14 | M | 1 | Claude | P1-BACK-01 | PR #12 — BaseTenantService[ModelType] generic CRUD with tenant_id isolation, 9 tests |

#### Frontend Auth
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-FRONT-01 | Login page (React Hook Form + Zod) | `completed` ✅ 2026-02-14 | S | 1 | Claude | — | feat/frontend-auth-sprint — shadcn/ui split-screen layout, Zod validation, AuthContext |
| P1-FRONT-02 | Register page | `completed` ✅ 2026-02-14 | S | 1 | Claude | P1-FRONT-01 | feat/frontend-auth-sprint — password strength, confirmPassword refine, auto tenant_id (crypto.randomUUID()) |
| P1-FRONT-03 | Auth middleware & protected routes | `completed` ✅ 2026-02-14 | XS | 1 | Claude | P1-FRONT-01 | feat/frontend-auth-sprint — src/middleware.ts, cookie dp_token, redirect to /login if no token |
| P1-FRONT-04 | API client setup (lib/api.ts) | `completed` ✅ 2026-02-14 | S | 1 | Claude | — | feat/frontend-auth-sprint — JWT refresh rotation, isRefreshing + subscribers pattern, error interceptor |

---

### Sprint 2: Data Connectors (Week 3–4)

#### Connector Service
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-BACK-05 | Implement connector service (base) | `todo` | M | 1 | — | P1-CORE-01 | test_connection, get_schema, encrypt/decrypt config (Fernet) |
| P1-BACK-06 | PostgreSQL connector | `todo` | M | 1 | — | P1-BACK-05 | Connection pooling, schema introspection (information_schema) |
| P1-BACK-07 | MySQL connector | `todo` | M | 2 | — | P1-BACK-05 | Similar to PostgreSQL, MySQL-specific schema queries |
| P1-BACK-08 | CSV/file connector (DuckDB) | `todo` | S | 2 | — | P1-BACK-05 | Upload handling, schema inference, queries via DuckDB |
| P1-BACK-09 | Data sources CRUD routes | `todo` | M | 1 | — | P1-BACK-08 | POST/GET/PUT/DELETE, test_connection endpoint |

#### Frontend Data Sources
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-FRONT-05 | Data sources list page | `todo` | S | 1 | — | P1-FRONT-04 | Display existing connections, delete, test |
| P1-FRONT-06 | Data source creation form | `todo` | M | 1 | — | P1-FRONT-05 | Wizard: select type → fill credentials → test → save |
| P1-FRONT-07 | PostgreSQL form (specific fields) | `todo` | XS | 1 | — | P1-FRONT-06 | host, port, username, password, database |
| P1-FRONT-08 | MySQL form | `todo` | XS | 2 | — | P1-FRONT-06 | Same as PostgreSQL |
| P1-FRONT-09 | CSV upload form | `todo` | S | 2 | — | P1-FRONT-06 | File picker, upload, schema preview |

---

### Sprint 3: AI & Query Engine (Week 5–8)

#### Query & AI Service
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-BACK-10 | Implement query service (base) | `todo` | M | 1 | — | P1-CORE-01 | SQL sanitization, tenant_id filtering, execution abstraction |
| P1-BACK-11 | Implement AI service (base) | `todo` | M | 1 | — | — | Claude API client setup, prompt engineering |
| P1-BACK-12 | Text-to-SQL prompt engineering | `todo` | L | 1 | — | P1-BACK-11 | Schema context, natural language → SQL, test queries |
| P1-BACK-13 | AI endpoint (/ai/query) | `todo` | M | 1 | — | P1-BACK-12 | POST {question, data_source_id} → {sql, results, chart_suggestion} |
| P1-BACK-14 | Execute queries (DuckDB/SQLAlchemy) | `todo` | M | 1 | — | P1-BACK-10 | Abstract query execution for DB or CSV |
| P1-BACK-15 | Chart type suggestion | `todo` | S | 2 | — | P1-BACK-14 | Analyze results → suggest bar/line/pie/table |

#### Frontend Chat & Visualization
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-FRONT-10 | Chat interface (question input) | `todo` | M | 1 | — | P1-FRONT-05 | Input field, send button, loading state |
| P1-FRONT-11 | Chat messages display | `todo` | M | 1 | — | P1-FRONT-10 | User/assistant message bubbles, SQL preview |
| P1-FRONT-12 | Recharts integration (wrapper components) | `todo` | M | 1 | — | — | BarChart, LineChart, PieChart, Table wrappers |
| P1-FRONT-13 | Chart rendering from AI results | `todo` | M | 1 | — | P1-FRONT-12 | Render chart based on suggestion, handle errors |
| P1-FRONT-14 | Query result display (table + chart) | `todo` | S | 1 | — | P1-FRONT-13 | Toggle view, pagination, export CSV |

---

### Sprint 4: Dashboards & Layout (Week 9–12)

#### Dashboards CRUD
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-BACK-16 | Dashboards model + migrations | `todo` | S | 1 | — | P1-BACK-01 | layout_json, workspace_id, tenant_id |
| P1-BACK-17 | Widgets model (queries stored in dashboards) | `todo` | S | 1 | — | P1-BACK-16 | query_json, chart_type, position in grid |
| P1-BACK-18 | Dashboards CRUD routes | `todo` | M | 1 | — | P1-BACK-17 | POST/GET/PUT/DELETE, list dashboards |
| P1-BACK-19 | Workspaces CRUD | `todo` | S | 1 | — | P1-BACK-01 | Create workspace, multi-workspace isolation |

#### Frontend Dashboard Editor
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-FRONT-15 | Workspace switcher | `todo` | XS | 2 | — | P1-FRONT-02 | Sidebar dropdown, switch workspaces |
| P1-FRONT-16 | Dashboards list page | `todo` | S | 1 | — | P1-FRONT-05 | Display all dashboards, create/edit/delete |
| P1-FRONT-17 | Dashboard view (read-only) | `todo` | M | 1 | — | P1-FRONT-16 | Display widgets, real-time chart rendering |
| P1-FRONT-18 | Dashboard edit mode (basic grid) | `todo` | L | 1 | — | P1-FRONT-17 | Add/remove/reorder widgets (simple grid, no drag-drop yet) |
| P1-FRONT-19 | Sidebar layout (main app layout) | `todo` | M | 1 | — | P1-FRONT-15 | Navigation, user menu, logout |

---

### Sprint 5: Testing & Deployment (Week 13–16)

#### Testing
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-TEST-01 | Backend integration tests | `todo` | M | 2 | — | P1-BACK-19 | Auth + connector + AI flow end-to-end |
| P1-TEST-02 | Frontend component tests | `todo` | M | 2 | — | P1-FRONT-19 | Jest + React Testing Library |
| P1-TEST-03 | E2E tests (Playwright) | `todo` | L | 2 | — | P1-TEST-02 | Login → create source → ask question → view dashboard |

#### Deployment & Docs
| ID | Task | Status | Effort | Priority | Owner | Depends | Notes |
|---|------|--------|--------|----------|-------|---------|-------|
| P1-INFRA-01 | Docker Compose setup (local dev) | `todo` | S | 1 | — | — | backend, frontend, postgres, nginx containers |
| P1-INFRA-02 | Dockerfile optimization | `todo` | S | 2 | — | P1-INFRA-01 | Multi-stage builds, security best practices |
| P1-INFRA-03 | CI/CD GitHub Actions | `todo` | M | 2 | — | P1-TEST-03 | Lint, test, build on PR; deploy to staging on merge |
| P1-INFRA-04 | Production deployment (OVH VPS) | `todo` | L | 1 | — | P1-INFRA-03 | SSH deploy, environment variables, SSL |
| P1-DOCS-01 | README.md (dev setup + usage) | `todo` | S | 2 | — | P1-INFRA-01 | Quick start guide, architecture diagram |
| P1-DOCS-02 | API documentation (OpenAPI/Swagger) | `todo` | S | 2 | — | P1-BACK-19 | Auto-generated from FastAPI, /docs endpoint |
| P1-DOCS-03 | Contributing guide (open source) | `todo` | S | 2 | — | P1-DOCS-01 | Dev setup, coding standards, PR process |

---

## 🔗 Dependencies Map

```
Auth Setup (P1-BACK-02, P1-FRONT-01)
├── Multi-tenant core (P1-CORE-01)
│   ├── Connector Service (P1-BACK-05)
│   │   ├── PostgreSQL/MySQL (P1-BACK-06, 07)
│   │   ├── CSV (P1-BACK-08)
│   │   └── Data sources CRUD (P1-BACK-09)
│   │       └── Frontend: Sources UI (P1-FRONT-05..09)
│   │
│   ├── Query Service (P1-BACK-10)
│   │   └── Execution (P1-BACK-14)
│   │       └── Frontend: Chart rendering (P1-FRONT-12..14)
│   │
│   └── AI Service (P1-BACK-11)
│       ├── Text-to-SQL (P1-BACK-12)
│       └── AI Endpoint (P1-BACK-13)
│           └── Frontend: Chat (P1-FRONT-10..11)
│
├── Dashboards (P1-BACK-16..19)
│   └── Frontend: Dashboard Editor (P1-FRONT-16..18)
│
└── Testing (P1-TEST-01..03)
    └── Deployment (P1-INFRA-01..04, P1-DOCS-01..03)
```

---

## 🎓 Learning Goals (for blog post later)

Each task should include:
- 📖 **Pattern used** (e.g., "SQLAlchemy async session management")
- 🧠 **Claude Code tricks** (e.g., "/epct workflow", "multi-tenant-guard skill")
- 🎯 **Best practice** (e.g., "always filter by tenant_id")

---

## 📝 Notes for Task Validation

When `/datapilot-taskmaster validate <task-id>` is run:
1. ✅ Check task status changed to `completed`
2. 📝 Update BACKLOG.md with completion date
3. 🔗 Link to GitHub issue/PR
4. 📚 Extract learning notes for blog
5. 🔄 Trigger updates to related `.claude` files (MEMORY.md, etc.)
6. 📊 Recalculate completion rate

---

## 🚀 How to Use This Backlog

### Start a task
```bash
/run-tasks P1-BACK-02
# This will:
# 1. Create a GitHub issue if not exists
# 2. Create a feature branch
# 3. Run EPCT workflow
# 4. Create a PR when done
```

### Validate completion
```bash
/datapilot-taskmaster validate P1-BACK-02
# This will:
# 1. Check PR merged
# 2. Update BACKLOG.md
# 3. Update MEMORY.md with learnings
# 4. Recalculate progress
```

### View project status
```bash
/datapilot-taskmaster status
# Shows: completion %, critical path, blockers
```

---

## 📅 Timeline

| Week | Sprint | Focus | Target |
|------|--------|-------|--------|
| 1–2 | #1 | Auth foundation | Backend auth + frontend login |
| 3–4 | #2 | Data connectors | PostgreSQL, MySQL, CSV |
| 5–8 | #3 | AI & query engine | Text-to-SQL, chart suggestions |
| 9–12 | #4 | Dashboards | Full CRUD, basic editor |
| 13–16 | #5 | Testing & deploy | E2E tests, OVH production |

**Go-live target**: End of Week 16 (mid-April 2026)

---

## 📌 Critical Path Tasks (cannot be parallelized)

1. **P1-BACK-01** — Migrations setup
2. **P1-BACK-02** → **P1-BACK-03** — Auth service + routes
3. **P1-CORE-01** — Multi-tenant isolation
4. **P1-BACK-05** — Connector service base
5. **P1-BACK-10** — Query service
6. **P1-BACK-11** → **P1-BACK-13** — AI service full stack
7. **P1-BACK-19** — Dashboards
8. **P1-INFRA-04** — Prod deployment

---

**Last updated**: 2026-02-14 by Claude Code (after frontend auth sprint)
**Next review**: After each sprint completion
