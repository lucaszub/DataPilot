from snowflake_wrapper import SnowflakeAPI

sf = SnowflakeAPI()

# Obtenir les 10 premières lignes
print(sf.get_top_n_rows("VALFONC_ANALYTICS_DBT.GOLD.DIM_ADDRESS_ENRICHED"))

# Obtenir le nombre de lignes
print(sf.get_row_count("VALFONC_ANALYTICS_DBT.GOLD.DIM_ADDRESS_ENRICHED"))

# Obtenir la liste des colonnes
print(sf.get_columns("VALFONC_ANALYTICS_DBT.GOLD.DIM_ADDRESS_ENRICHED"))

# Exécuter une requête SELECT personnalisée
result = sf.run_select("SELECT id, name FROM VALFONC_ANALYTICS_DBT.GOLD.DIM_ADDRESS_ENRICHED WHERE active = 1")
print(result)
