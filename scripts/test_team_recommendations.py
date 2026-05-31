"""Smoke-test team recommendation generation via API login."""

import json
import urllib.request
import urllib.error
import psycopg2

BASE = "http://localhost:5000/api"

conn = psycopg2.connect(
    host="localhost", port=5432, dbname="skillswap_db", user="postgres", password="123456789"
)
cur = conn.cursor()
cur.execute(
    """
    SELECT cr.id, cr.company_profile_id, cr.title, cr.request_type, cr.status
    FROM company_requests cr
    WHERE cr.request_type = 'ai-built-team'
    ORDER BY cr.id DESC
    LIMIT 5
    """
)
requests = cur.fetchall()
print("ai-built-team requests:", requests)

cur.execute(
    """
    SELECT u.email, u.password, cp.id
    FROM company_profiles cp
    JOIN users u ON u.id = cp.user_id
    LIMIT 1
    """
)
company = cur.fetchone()
conn.close()

if not requests:
    print("No ai-built-team requests found")
    raise SystemExit(1)

request_id = requests[0][0]
print("Using request_id:", request_id)

# Try common dev passwords - user may need to adjust
login_body = json.dumps({"email": company[0], "password": "Password123!"}).encode()
req = urllib.request.Request(
    f"{BASE}/auth/login",
    data=login_body,
    headers={"Content-Type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        login = json.loads(resp.read())
except urllib.error.HTTPError as e:
    print("Login failed:", e.read().decode())
    raise SystemExit(1)

token = login.get("token") or login.get("Token")
if not token:
    print("No token in login response", login)
    raise SystemExit(1)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

for path, method, body in [
    (f"/company/requests/{request_id}/team-recommendations/regenerate", "POST", {"forceRegenerate": True}),
    (f"/company/requests/{request_id}/team-recommendations", "GET", None),
]:
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            payload = json.loads(resp.read())
            teams = payload.get("teams") or payload.get("Teams") or []
            print(f"\n{method} {path} -> {resp.status}")
            print("teams:", len(teams))
            if teams:
                t = teams[0]
                print("team1 rank:", t.get("teamRank"), "score:", t.get("totalScore"))
                members = t.get("members") or []
                print("members:", len(members))
                for m in members:
                    print(
                        " ",
                        m.get("roleName"),
                        "->",
                        m.get("studentName"),
                        f"fit={m.get('roleScore')}%",
                    )
                student_ids = [m.get("studentProfileId") for m in members]
                print("unique students:", len(student_ids) == len(set(student_ids)))
    except urllib.error.HTTPError as e:
        print(f"\n{method} {path} FAILED", e.code, e.read().decode()[:500])
