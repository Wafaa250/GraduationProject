"""Compare seed INSERT columns against live PostgreSQL schema."""
import os
import re
import subprocess
import sys
from pathlib import Path

SEED = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("skillswap-demo-seed.sql")
PSQL = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"

os.environ["PGPASSWORD"] = "123456789"
out = subprocess.check_output(
    [
        PSQL,
        "-h",
        "localhost",
        "-p",
        "5432",
        "-U",
        "postgres",
        "-d",
        "skillswap_db",
        "-t",
        "-A",
        "-F",
        "|",
        "-c",
        "SELECT table_name, column_name FROM information_schema.columns "
        "WHERE table_schema='public' ORDER BY table_name, ordinal_position",
    ],
    text=True,
)

db_cols: dict[str, set[str]] = {}
for line in out.strip().splitlines():
    if "|" not in line:
        continue
    table, column = line.split("|", 1)
    db_cols.setdefault(table, set()).add(column)

seed = SEED.read_text(encoding="utf-8")
insert_re = re.compile(r'INSERT INTO public\.("?[\w]+"?) \(([^)]+)\)', re.I)

issues: list[tuple[str, str, list[str]]] = []
seen_tables: set[str] = set()

for match in insert_re.finditer(seed):
    table = match.group(1).strip('"')
    cols = [c.strip().strip('"') for c in match.group(2).split(",")]
    if table in seen_tables:
        continue
    seen_tables.add(table)

    if table not in db_cols:
        issues.append((table, "TABLE_MISSING_IN_DB", cols))
        continue

    missing_in_db = [c for c in cols if c not in db_cols[table]]
    if missing_in_db:
        issues.append((table, "COLUMN_MISSING_IN_DB", missing_in_db))

print(f"Validating {SEED.name}")
print("Schema mismatches:")
for table, kind, detail in sorted(issues):
    print(f"  {table}: {kind}: {detail}")

print(f"\nChecked {len(seen_tables)} tables, found {len(issues)} mismatches")
