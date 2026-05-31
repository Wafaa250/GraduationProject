import psycopg2

conn = psycopg2.connect(
    host="localhost", port=5432, dbname="skillswap_db", user="postgres", password="123456789"
)
conn.autocommit = True
cur = conn.cursor()
cur.execute(
    """
    DELETE FROM "__EFMigrationsHistory"
    WHERE "MigrationId" = '20260528141236_AddCompanyRequestTeamRecommendations'
    """
)
print("Removed migration history row:", cur.rowcount)
conn.close()
