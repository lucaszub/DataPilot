# snowflake_wrapper.py
import requests

class SnowflakeAPI:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url

    # Exécute une requête SELECT simple
    def run_query(self, sql: str):
        try:
            response = requests.post(f"{self.base_url}/run_query", json={"sql": sql})
            data = response.json()
            if "error" in data:
                raise ValueError(data["error"])
            return data["result"]
        except Exception as e:
            return {"error": str(e)}

    # Décrit la structure d'une table
    def describe_table(self, table_name: str):
        try:
            response = requests.get(f"{self.base_url}/describe_table/{table_name}")
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    # Retourne les N premières lignes d'une table
    def get_top_n_rows(self, table_name: str, n: int = 10):
        sql = f"SELECT * FROM {table_name} LIMIT {n}"
        return self.run_query(sql)

    # Retourne le nombre de lignes d'une table
    def get_row_count(self, table_name: str):
        sql = f"SELECT COUNT(*) FROM {table_name}"
        result = self.run_query(sql)
        return result[0][0] if result and not "error" in result else result

    # Retourne la liste des colonnes d'une table
    def get_columns(self, table_name: str):
        desc = self.describe_table(table_name)
        if "error" in desc:
            return desc
        return [col[0] for col in desc.get("result", [])]

    # Requête générique avec limite automatique si nécessaire
    def run_select(self, sql: str, limit: int = 100):
        sql_lower = sql.lower()
        if not sql_lower.startswith("select"):
            return {"error": "Only SELECT queries allowed"}
        if "limit" not in sql_lower:
            sql += f" LIMIT {limit}"
        return self.run_query(sql)
