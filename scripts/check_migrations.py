import psycopg2

conn = psycopg2.connect(
    host="localhost", port=5432, dbname="skillswap_db", user="postgres", password="123456789"
)
cur = conn.cursor()
cur.execute(
    'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId"'
)
for row in cur.fetchall():
    if "Team" in row[0] or "Recommendation" in row[0]:
        print(row[0])
cur.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'company_request_team%'"
)
print("tables:", cur.fetchall())
conn.close()
