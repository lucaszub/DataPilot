# Data Sources API

> Base URL: `http://localhost:8000/api/v1/data-sources`

## Overview
Manage CSV data sources for your DataPilot workspace. Upload CSV files, list your data sources, preview data, and delete when no longer needed. All endpoints are tenant-isolated (multi-tenant).

**Authentication**: All endpoints require an `Authorization: Bearer $TOKEN` header with a valid JWT access token (obtained via `/api/v1/auth/login`).

---

## Endpoints

### 1. Upload CSV

**POST** `/upload`

Create a new data source by uploading a CSV file. The file is automatically processed and converted to Parquet format for optimized storage and querying.

**Headers**:
```
Authorization: Bearer $TOKEN
Content-Type: multipart/form-data
```

**Form Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file` | File | Yes | CSV file to upload (max 100MB) |
| `name` | String | Yes | Display name for the data source |

**Curl Example**:
```bash
curl -X POST http://localhost:8000/api/v1/data-sources/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sales-data.csv" \
  -F "name=Q1 Sales Data"
```

**Response** `201 Created`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "csv",
  "name": "Q1 Sales Data",
  "schema_cache": {
    "columns": [
      {"name": "product_name", "type": "VARCHAR"},
      {"name": "sales_amount", "type": "BIGINT"},
      {"name": "date", "type": "DATE"}
    ],
    "row_count": 1500,
    "sample_rows": [
      {"product_name": "Widget A", "sales_amount": 1500, "date": "2026-01-15"}
    ]
  },
  "created_at": "2026-02-14T10:30:45Z"
}
```

**Error Responses**:
| Status | Error | Description |
|--------|-------|-------------|
| `400` | Bad Request | File is empty, not a .csv file, or missing filename |
| `413` | Payload Too Large | File exceeds 100MB limit |
| `422` | Unprocessable Entity | CSV parsing failed (invalid format, encoding issues) |

---

### 2. List Data Sources

**GET** `/`

Retrieve a paginated list of all data sources for the current tenant.

**Headers**:
```
Authorization: Bearer $TOKEN
```

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `skip` | int | `0` | Number of items to skip |
| `limit` | int | `20` | Maximum items to return (max 100) |

**Curl Example**:
```bash
curl "http://localhost:8000/api/v1/data-sources/?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `200 OK`:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "csv",
    "name": "Q1 Sales Data",
    "row_count": 1500,
    "column_count": 3,
    "created_at": "2026-02-14T10:30:45Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "type": "csv",
    "name": "Customer Base",
    "row_count": 42500,
    "column_count": 8,
    "created_at": "2026-02-13T14:22:10Z"
  }
]
```

**Error Responses**:
| Status | Error | Description |
|--------|-------|-------------|
| `401` | Unauthorized | Missing or invalid bearer token |

---

### 3. Get Data Source Details

**GET** `/{data_source_id}`

Retrieve full details of a specific data source, including the complete schema cache with sample rows.

**Headers**:
```
Authorization: Bearer $TOKEN
```

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `data_source_id` | UUID | ID of the data source |

**Curl Example**:
```bash
curl "http://localhost:8000/api/v1/data-sources/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `200 OK`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "csv",
  "name": "Q1 Sales Data",
  "schema_cache": {
    "columns": [
      {"name": "product_name", "type": "VARCHAR"},
      {"name": "sales_amount", "type": "BIGINT"},
      {"name": "date", "type": "DATE"}
    ],
    "row_count": 1500,
    "sample_rows": [
      {"product_name": "Widget A", "sales_amount": 1500, "date": "2026-01-15"}
    ]
  },
  "created_at": "2026-02-14T10:30:45Z"
}
```

**Error Responses**:
| Status | Error | Description |
|--------|-------|-------------|
| `404` | Not Found | Data source does not exist or belongs to another tenant (multi-tenant isolation) |

---

### 4. Preview Data Source (Paginated)

**GET** `/{data_source_id}/preview`

Retrieve a paginated preview of the CSV data. Useful for data exploration and validation before building dashboards or semantic models.

**Headers**:
```
Authorization: Bearer $TOKEN
```

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `data_source_id` | UUID | ID of the data source |

**Query Parameters**:
| Param | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `page` | int | `1` | >= 1 | Page number (1-based indexing) |
| `page_size` | int | `50` | 1-1000 | Rows per page |

**Curl Example**:
```bash
curl "http://localhost:8000/api/v1/data-sources/550e8400-e29b-41d4-a716-446655440000/preview?page=1&page_size=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `200 OK`:
```json
{
  "columns": [
    {"name": "product_name", "type": "VARCHAR"},
    {"name": "sales_amount", "type": "BIGINT"},
    {"name": "date", "type": "DATE"}
  ],
  "rows": [
    {"product_name": "Widget A", "sales_amount": 1500, "date": "2026-01-15"},
    {"product_name": "Widget B", "sales_amount": 900, "date": "2026-01-16"},
    {"product_name": "Widget C", "sales_amount": 2200, "date": "2026-01-17"}
  ],
  "total_rows": 1500,
  "page": 1,
  "page_size": 50,
  "total_pages": 30
}
```

**Error Responses**:
| Status | Error | Description |
|--------|-------|-------------|
| `404` | Not Found | Data source does not exist or belongs to another tenant |
| `422` | Unprocessable Entity | Parquet file missing or corrupted (data source integrity issue) |

---

### 5. Delete Data Source

**DELETE** `/{data_source_id}`

Permanently delete a data source. Both the database record and associated files on disk (original CSV and processed Parquet) are removed. This action is irreversible.

**Headers**:
```
Authorization: Bearer $TOKEN
```

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `data_source_id` | UUID | ID of the data source |

**Curl Example**:
```bash
curl -X DELETE "http://localhost:8000/api/v1/data-sources/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response** `204 No Content` — No response body. Files on disk are automatically cleaned up.

**Error Responses**:
| Status | Error | Description |
|--------|-------|-------------|
| `404` | Not Found | Data source does not exist or belongs to another tenant |

---

## Quick Test Flow

This complete flow demonstrates authentication and all data-sources endpoints:

```bash
#!/bin/bash
set -e

BASE_URL="http://localhost:8000/api/v1"
TENANT_ID="550e8400-e29b-41d4-a716-446655440001"

# 1. Register a new user
echo "1. Registering user..."
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser@example.com\",\"password\":\"Test1234!\",\"tenant_id\":\"$TENANT_ID\"}" \
  > /dev/null
echo "   User registered"

# 2. Login to get access token
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test1234!"}')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "   Token obtained: ${TOKEN:0:20}..."

# 3. Upload a CSV file
echo "3. Uploading CSV..."
# Create sample CSV first
cat > /tmp/sample-sales.csv << EOF
product_name,sales_amount,date
Widget A,1500,2026-01-15
Widget B,900,2026-01-16
Widget C,2200,2026-01-17
Gadget X,3100,2026-01-18
Gadget Y,1850,2026-01-19
EOF

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/data-sources/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/sample-sales.csv" \
  -F "name=Q1 Sales Data")
DS_ID=$(echo $UPLOAD_RESPONSE | jq -r '.id')
echo "   Data source created: $DS_ID"
echo "   Response:"
echo $UPLOAD_RESPONSE | jq '.'

# 4. List all data sources
echo ""
echo "4. Listing data sources..."
curl -s "$BASE_URL/data-sources/?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Get details of the uploaded data source
echo ""
echo "5. Getting data source details..."
curl -s "$BASE_URL/data-sources/$DS_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Preview data (paginated)
echo ""
echo "6. Previewing data (page 1, 50 rows)..."
curl -s "$BASE_URL/data-sources/$DS_ID/preview?page=1&page_size=50" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 7. Delete the data source
echo ""
echo "7. Deleting data source..."
curl -s -X DELETE "$BASE_URL/data-sources/$DS_ID" \
  -H "Authorization: Bearer $TOKEN"
echo "   Data source deleted (204 No Content)"

# 8. Verify deletion (should return 404)
echo ""
echo "8. Verifying deletion (expecting 404)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/data-sources/$DS_ID" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "Test flow completed successfully!"
```

### Expected Flow Output

1. User registers successfully
2. Login returns access token
3. CSV upload creates data source with schema inference (columns detected, row count = 5)
4. List shows 1 data source
5. Get details shows full schema with sample rows
6. Preview returns first 50 rows (or all 5 rows if file is smaller)
7. Delete succeeds with 204
8. Verification returns 404 confirming deletion

---

## Data Type Mapping

CSV columns are automatically mapped to SQL types during upload:

| CSV Sample | Inferred Type | Notes |
|-----------|---------------|-------|
| `123` | BIGINT | Integer values |
| `123.45` | DOUBLE | Floating point values |
| `2026-02-14` | DATE | ISO 8601 date format |
| `2026-02-14T10:30:45Z` | TIMESTAMP | ISO 8601 datetime format |
| `true`, `false` | BOOLEAN | Boolean values |
| Any text | VARCHAR | Default for text columns |

---

## Storage & Performance Notes

- **File Limit**: 100MB per upload (enforced server-side)
- **Storage Path**: `/var/datapilot/uploads/{tenant_id}/{data_source_id}/`
- **File Format**: Original CSV + processed Parquet (for optimized querying)
- **Multi-tenant**: All data is isolated by `tenant_id`. A user can only access data sources they uploaded.
- **Preview Caching**: Schema information is cached in the database on upload; previews query the Parquet file directly.

---

## Error Handling

All endpoints follow HTTP status codes:

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success | Data retrieved |
| `201` | Created | Data source uploaded |
| `204` | No Content | Data source deleted |
| `400` | Bad Request | Invalid file format or missing parameters |
| `401` | Unauthorized | Missing or invalid bearer token |
| `404` | Not Found | Data source belongs to another tenant or does not exist |
| `413` | Payload Too Large | File exceeds 100MB |
| `422` | Unprocessable Entity | CSV parsing failed or Parquet file corrupted |
| `500` | Server Error | Unexpected error (check server logs) |

---

## Security & Multi-tenancy

- **Tenant Isolation**: All queries are automatically filtered by `tenant_id`. Users can only access their own data.
- **File Storage**: Encrypted credentials stored in `connection_config_encrypted` field.
- **Access Control**: Only authenticated users (valid JWT token) can upload, list, preview, or delete data sources.
- **File Cleanup**: Deletion removes files from disk, not just database records.
