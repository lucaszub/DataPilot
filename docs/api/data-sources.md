# Data Sources API

> Base URL: `http://localhost:8000/api/v1/data-sources`

All endpoints require authentication via Bearer token.

---

## Upload CSV

```bash
curl -X POST http://localhost:8000/api/v1/data-sources/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your-file.csv" \
  -F "name=My Dataset"
```

**Response** `201 Created`:
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "type": "csv",
  "name": "My Dataset",
  "schema_cache": {
    "columns": [
      {"name": "col1", "type": "VARCHAR"},
      {"name": "col2", "type": "BIGINT"}
    ],
    "row_count": 1500,
    "sample_rows": [{"col1": "value", "col2": 42}]
  },
  "created_at": "2026-02-14T10:00:00Z"
}
```

**Errors**:
- `400` — File is empty, not .csv, or missing filename
- `413` — File exceeds 100MB limit
- `422` — CSV parsing failed (invalid format)

---

## List Data Sources

```bash
curl http://localhost:8000/api/v1/data-sources/ \
  -H "Authorization: Bearer $TOKEN"
```

**Query params**: `?skip=0&limit=20`

**Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "type": "csv",
    "name": "My Dataset",
    "row_count": 1500,
    "column_count": 5,
    "created_at": "2026-02-14T10:00:00Z"
  }
]
```

---

## Get Data Source

```bash
curl http://localhost:8000/api/v1/data-sources/{id} \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `200 OK`: Same as upload response (full schema_cache included).

**Errors**: `404` — Not found or belongs to another tenant.

---

## Delete Data Source

```bash
curl -X DELETE http://localhost:8000/api/v1/data-sources/{id} \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `204 No Content` — Files on disk are also removed.

---

## Preview Data Source (paginated)

```bash
curl "http://localhost:8000/api/v1/data-sources/{id}/preview?page=1&page_size=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Query params**:
| Param | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `page` | int | `1` | >= 1 | Page number (1-based) |
| `page_size` | int | `50` | 1 – 1000 | Number of rows per page |

**Response** `200 OK`:
```json
{
  "columns": [
    {"name": "product_name", "type": "VARCHAR"},
    {"name": "sales", "type": "BIGINT"}
  ],
  "rows": [
    {"product_name": "Widget A", "sales": 1500},
    {"product_name": "Widget B", "sales": 900}
  ],
  "total_rows": 1500,
  "page": 1,
  "page_size": 50,
  "total_pages": 30
}
```

**Errors**:
- `400` — Invalid query parameters (handled by `422` FastAPI validation)
- `404` — Data source not found or belongs to another tenant
- `422` — Parquet file missing (data source corrupted)

---

## Quick Test Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","tenant_id":"550e8400-e29b-41d4-a716-446655440000"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' | jq -r .access_token)

# 3. Upload CSV
curl -X POST http://localhost:8000/api/v1/data-sources/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample.csv" \
  -F "name=Sales Data"

# 4. List
curl http://localhost:8000/api/v1/data-sources/ \
  -H "Authorization: Bearer $TOKEN"

# 5. Preview (paginated)
DS_ID="<id from upload response>"
curl "http://localhost:8000/api/v1/data-sources/$DS_ID/preview?page=1&page_size=50" \
  -H "Authorization: Bearer $TOKEN"
```
