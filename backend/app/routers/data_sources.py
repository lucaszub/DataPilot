from fastapi import APIRouter

router = APIRouter()


# TODO: Implement data source management
# GET / — list data sources (filtered by tenant_id)
# POST / — create data source (PostgreSQL, MySQL, CSV)
# GET /{id} — get data source
# DELETE /{id} — delete data source
# POST /{id}/test — test connection
# POST /{id}/sync-schema — refresh schema cache
