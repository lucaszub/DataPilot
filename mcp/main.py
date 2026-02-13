# mcp_server.py
from fastapi import FastAPI
from pydantic import BaseModel
import snowflake.connector

app = FastAPI()

conn = snowflake.connector.connect(
    user="LUCASZUB",
    password="Bonjour04!Medard44?",
    account="tlmanna-bc08454",
    warehouse="WH_DBT_VALFONC",
    database="VALFONC_RAW",
    schema="BRONZE",
    role="ANALYTICS_ROLE"
)

class QueryRequest(BaseModel):
    sql: str

@app.post("/run_query")
def run_query(req: QueryRequest):
    sql = req.sql.lower()
    if not sql.startswith("select"):
        return {"error": "Only SELECT allowed"}
    if "limit" not in sql:
        sql += " LIMIT 100"
    cs = conn.cursor()
    cs.execute(sql)
    return {"result": cs.fetchall()}

@app.get("/describe_table/{table_name}")
def describe_table(table_name: str):
    cs = conn.cursor()
    cs.execute(f"DESC TABLE {table_name}")
    return {"result": cs.fetchall()}
