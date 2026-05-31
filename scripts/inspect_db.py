import json
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="skillswap_db",
    user="postgres",
    password="123456789",
)
cur = conn.cursor()

queries = {
    "tables": """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """,
    "counts": """
        SELECT 'users' AS t, COUNT(*) FROM users
        UNION ALL SELECT 'student_profiles', COUNT(*) FROM student_profiles
        UNION ALL SELECT 'skills', COUNT(*) FROM skills
        UNION ALL SELECT 'student_skills', COUNT(*) FROM student_skills
        UNION ALL SELECT 'company_profiles', COUNT(*) FROM company_profiles
        UNION ALL SELECT 'company_requests', COUNT(*) FROM company_requests
    """,
    "users_by_role": "SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role",
    "max_ids": """
        SELECT
          (SELECT COALESCE(MAX(id),0) FROM users) AS max_user_id,
          (SELECT COALESCE(MAX(id),0) FROM student_profiles) AS max_student_profile_id,
          (SELECT COALESCE(MAX(id),0) FROM skills) AS max_skill_id,
          (SELECT COALESCE(MAX(id),0) FROM student_skills) AS max_student_skill_id
    """,
    "sample_students": """
        SELECT sp.id, u.name, u.email, sp.major, sp.academic_year,
               LEFT(sp.bio, 80) AS bio_preview,
               LEFT(sp.roles, 60) AS roles_json,
               LEFT(sp.technical_skills, 60) AS tech_json,
               LEFT(sp.tools, 60) AS tools_json,
               (SELECT COUNT(*) FROM student_skills ss WHERE ss.student_id = sp.id) AS skill_links
        FROM student_profiles sp
        JOIN users u ON u.id = sp.user_id
        ORDER BY sp.id
        LIMIT 15
    """,
    "skill_categories": "SELECT category, COUNT(*) FROM skills GROUP BY category ORDER BY category",
    "top_skills": "SELECT id, name, category FROM skills ORDER BY id",
    "students_missing_skills": """
        SELECT sp.id, u.name, sp.major,
               COALESCE(sp.roles,'')='' AND COALESCE(sp.technical_skills,'')='' AND COALESCE(sp.tools,'')='' AS empty_skill_json
        FROM student_profiles sp
        JOIN users u ON u.id = sp.user_id
        ORDER BY sp.id
    """,
    "students_without_profile": """
        SELECT u.id, u.name, u.email FROM users u
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        WHERE u.role='student' AND sp.id IS NULL
    """,
    "team_tables": """
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_name LIKE 'company_request_team%'
        ORDER BY 1
    """,
    "user_columns": """
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name='users' ORDER BY ordinal_position
    """,
    "student_profile_columns": """
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name='student_profiles' ORDER BY ordinal_position
    """,
}

for name, sql in queries.items():
    print(f"\n=== {name} ===")
    cur.execute(sql)
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    for row in rows:
        print(dict(zip(cols, row)))

conn.close()
