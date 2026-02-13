import json
from snowflake_wrapper import SnowflakeAPI

sf = SnowflakeAPI()

sql = """
SELECT CODE_POSTAL, COUNT(*) AS cnt
FROM VALFONC_ANALYTICS_DBT.GOLD.DIM_ADDRESS_ENRICHED
GROUP BY CODE_POSTAL
ORDER BY cnt DESC
LIMIT 50;
"""

res = sf.run_select(sql, limit=50)

# Print human-readable JSON
try:
    print(json.dumps(res, ensure_ascii=False, indent=2))
except Exception:
    print(res)
