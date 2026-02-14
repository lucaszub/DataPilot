# Queries API

> Base URL: `http://localhost:8000/api/v1/queries`

## Overview
Execute SQL queries against your workspace's semantic layer and save queries for reuse. The query engine uses DuckDB to run read-only SQL against parquet files registered via the semantic layer. All endpoints are tenant-isolated.

**Authentication**: All endpoints require an `Authorization: Bearer $TOKEN` header.

---

## Endpoints

### 1. Execute SQL Query

**POST** `/execute`

Run a read-only SQL query against the workspace's semantic layer. Tables defined in the semantic layer are available as DuckDB views.

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sql_text` | string | Yes | SQL query (SELECT/WITH/EXPLAIN only) |
| `workspace_id` | UUID | Yes | Workspace with a configured semantic layer |
| `limit` | int | No | Max rows to return (default: 10000, max: 50000) |

**Curl Example**:
```bash
curl -X POST http://localhost:8000/api/v1/queries/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sql_text": "SELECT name, SUM(amount) AS total FROM sales GROUP BY name ORDER BY total DESC",
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response** `200 OK`:
```json
{
  "columns": [
    {"name": "name", "type": "VARCHAR"},
    {"name": "total", "type": "DOUBLE"}
  ],
  "rows": [
    {"name": "Bob", "total": 200.0},
    {"name": "Charlie", "total": 150.0},
    {"name": "Alice", "total": 100.0}
  ],
  "row_count": 3,
  "execution_time_ms": 12.45
}
```

**Error Responses**:
| Status | Error | Description |
|--------|-------|-------------|
| `400` | Bad Request | Forbidden SQL (DROP, DELETE, etc.), invalid SQL syntax, or empty query |
| `404` | Not Found | No semantic layer configured for this workspace |
| `422` | Unprocessable Entity | Semantic layer has no definitions |

**SQL Restrictions**:
- Only `SELECT`, `WITH`, and `EXPLAIN` queries are allowed
- Forbidden: `DROP`, `DELETE`, `INSERT`, `UPDATE`, `CREATE`, `ALTER`, `TRUNCATE`, `GRANT`, `REVOKE`
- `LIMIT` is automatically appended if missing

---

### 2. Create Saved Query

**POST** `/saved`

Save a query for later reuse in dashboards or the explorer.

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name (max 255 chars) |
| `sql_text` | string | Yes | SQL query text |
| `workspace_id` | UUID | Yes | Workspace this query belongs to |
| `chart_type` | string | No | Visualization type: `bar`, `line`, `pie`, `kpi`, `table` |

**Curl Example**:
```bash
curl -X POST http://localhost:8000/api/v1/queries/saved \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Top Products by Revenue",
    "sql_text": "SELECT name, SUM(amount) AS total FROM sales GROUP BY name ORDER BY total DESC LIMIT 10",
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
    "chart_type": "bar"
  }'
```

**Response** `201 Created`:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Top Products by Revenue",
  "sql_text": "SELECT name, SUM(amount) AS total FROM sales GROUP BY name ORDER BY total DESC LIMIT 10",
  "chart_type": "bar",
  "created_at": "2026-02-14T15:30:00Z",
  "updated_at": null
}
```

---

### 3. List Saved Queries

**GET** `/saved?workspace_id={id}`

List all saved queries for a workspace.

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | UUID | Yes | Filter by workspace |
| `skip` | int | No | Offset (default: 0) |
| `limit` | int | No | Max items (default: 100) |

**Curl Example**:
```bash
curl "http://localhost:8000/api/v1/queries/saved?workspace_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `200 OK`: Array of saved query objects.

---

### 4. Get Saved Query

**GET** `/saved/{query_id}`

**Curl Example**:
```bash
curl "http://localhost:8000/api/v1/queries/saved/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `200 OK`: Single saved query object.

**Error**: `404` if not found or belongs to another tenant.

---

### 5. Update Saved Query

**PUT** `/saved/{query_id}`

**Request Body** (all fields optional):
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | New name |
| `sql_text` | string | New SQL |
| `chart_type` | string | New chart type: `bar`, `line`, `pie`, `kpi`, `table` |

**Curl Example**:
```bash
curl -X PUT "http://localhost:8000/api/v1/queries/saved/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "chart_type": "line"}'
```

**Response** `200 OK`: Updated saved query object.

---

### 6. Delete Saved Query

**DELETE** `/saved/{query_id}`

**Curl Example**:
```bash
curl -X DELETE "http://localhost:8000/api/v1/queries/saved/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `204 No Content`.

---

## Quick Test Flow

```bash
BASE_URL="http://localhost:8000/api/v1"

# 1. Login
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@datapilot.fr","password":"Test1234!"}' | jq -r '.access_token')

# 2. Execute a query (requires workspace with semantic layer + uploaded CSV)
curl -s -X POST "$BASE_URL/queries/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sql_text\": \"SELECT * FROM sales LIMIT 5\", \"workspace_id\": \"$WS_ID\"}" | jq '.'

# 3. Save the query
SAVED=$(curl -s -X POST "$BASE_URL/queries/saved" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"All Sales\", \"sql_text\": \"SELECT * FROM sales\", \"workspace_id\": \"$WS_ID\", \"chart_type\": \"table\"}")
QID=$(echo $SAVED | jq -r '.id')

# 4. List saved queries
curl -s "$BASE_URL/queries/saved?workspace_id=$WS_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Update
curl -s -X PUT "$BASE_URL/queries/saved/$QID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chart_type": "bar"}' | jq '.'

# 6. Delete
curl -s -X DELETE "$BASE_URL/queries/saved/$QID" \
  -H "Authorization: Bearer $TOKEN"
```
