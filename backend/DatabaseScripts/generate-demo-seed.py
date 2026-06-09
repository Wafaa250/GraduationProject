"""Generate skillswap-demo-seed.sql from skillswap-production-seed.sql."""
import os
import re
import subprocess
from pathlib import Path

SRC = Path(__file__).with_name("skillswap-production-seed.sql")
DST = Path(__file__).with_name("skillswap-demo-seed.sql")
PSQL = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"

EXCLUDED = {
    "company_activity_logs",
    "company_member_notification_preferences",
    "company_request_recommendation_runs",
    "company_request_recommendations",
    "company_request_team_recommendation_runs",
    "company_request_team_recommendations",
    "company_request_team_recommendation_members",
    "company_saved_student_recommendations",
    "company_saved_team_recommendations",
    "recommendation_semantic_embeddings",
    "password_reset_codes",
    "password_reset_tokens",
    "student_organization_recruitment_applicant_analyses",
    "user_notifications",
    "course_team_invitations",
    "graduation_project_milestones",
}

ALL_TABLES_IN_SEED = [
    "users",
    "company_profiles",
    "company_activity_logs",
    "student_profiles",
    "company_follows",
    "company_member_notification_preferences",
    "company_members",
    "company_requests",
    "company_request_roles",
    "company_request_invitations",
    "company_request_recommendation_runs",
    "company_request_recommendations",
    "company_request_skills",
    "company_request_team_recommendation_runs",
    "company_request_team_recommendations",
    "company_request_team_recommendation_members",
    "company_saved_student_recommendations",
    "company_saved_team_recommendations",
    "company_talent_requests",
    "doctor_profiles",
    "courses",
    "course_projects",
    "course_teams",
    "conversations",
    "conversation_users",
    "course_sections",
    "course_project_sections",
    "course_team_invitations",
    "course_team_members",
    "course_team_messages",
    "doctor_posts",
    "feed_post_comments",
    "feed_post_engagements",
    "graduation_projects",
    "graduation_project_members",
    "graduation_project_milestones",
    "messages",
    "student_association_profiles",
    "organization_follows",
    "password_reset_codes",
    "password_reset_tokens",
    "project_invitations",
    "recommendation_semantic_embeddings",
    "section_chat_messages",
    "section_enrollments",
    "skills",
    "student_organization_events",
    "student_organization_event_registration_forms",
    "student_organization_event_registration_fields",
    "student_organization_event_registrations",
    "student_organization_event_registration_answers",
    "student_organization_recruitment_campaigns",
    "student_organization_recruitment_positions",
    "student_organization_recruitment_applications",
    "student_organization_team_members",
    "student_organization_members",
    "student_organization_recruitment_applicant_analyses",
    "student_organization_recruitment_questions",
    "student_organization_recruitment_application_answers",
    "student_posts",
    "student_skills",
    "supervisor_cancellation_requests",
    "supervisor_requests",
    "user_notifications",
]

INCLUDED = [t for t in ALL_TABLES_IN_SEED if t not in EXCLUDED]

EXCLUDED_SEQ_FRAGMENTS = [
    "company_activity_logs",
    "company_member_notification_preferences",
    "company_request_recommendation_runs",
    "company_request_recommendations",
    "company_request_team_recommendation",
    "company_saved_student",
    "company_saved_team",
    "recommendation_semantic_embeddings",
    "password_reset",
    "student_organization_recruitment_applicant_analyses",
    "user_notifications",
    "course_team_invitations",
    "graduation_project_milestones",
]

INSERT_RE = re.compile(
    r'^INSERT INTO public\.("?[\w]+"?) \(([^)]+)\) VALUES \((.*)\);$',
    re.IGNORECASE,
)
SECTION_RE = re.compile(r"^-- Data for Name: ([^;]+);")
SETVAL_RE = re.compile(r"setval\('public\.([^']+)'")


def load_db_columns() -> dict[str, set[str]]:
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
    cols: dict[str, set[str]] = {}
    for line in out.strip().splitlines():
        if "|" not in line:
            continue
        table, column = line.split("|", 1)
        cols.setdefault(table, set()).add(column)
    return cols


def split_sql_values(values_blob: str) -> list[str]:
    parts: list[str] = []
    current: list[str] = []
    in_string = False
    depth = 0
    i = 0
    while i < len(values_blob):
        ch = values_blob[i]
        if in_string:
            current.append(ch)
            if ch == "'":
                if i + 1 < len(values_blob) and values_blob[i + 1] == "'":
                    current.append(values_blob[i + 1])
                    i += 2
                    continue
                in_string = False
            i += 1
            continue

        if ch == "'":
            in_string = True
            current.append(ch)
        elif ch == "(":
            depth += 1
            current.append(ch)
        elif ch == ")":
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
        i += 1

    if current:
        parts.append("".join(current).strip())
    return parts


def normalize_insert(line: str, db_cols: dict[str, set[str]]) -> str | None:
    match = INSERT_RE.match(line)
    if not match:
        return line

    table = match.group(1).strip('"')
    if table not in db_cols:
        return None

    columns = [c.strip().strip('"') for c in match.group(2).split(",")]
    values = split_sql_values(match.group(3))
    if len(columns) != len(values):
        raise ValueError(f"Column/value count mismatch for {table}: {len(columns)} vs {len(values)}")

    allowed = db_cols[table]
    kept_cols: list[str] = []
    kept_vals: list[str] = []
    for col, val in zip(columns, values):
        if col in allowed:
            kept_cols.append(f'"{col}"' if col[0].isupper() else col)
            kept_vals.append(val)

    if not kept_cols:
        return None

    return (
        f"INSERT INTO public.{table} ({', '.join(kept_cols)}) "
        f"VALUES ({', '.join(kept_vals)});"
    )


HEADER = f"""-- =============================================================================
-- SkillSwap Demo Data Seed
-- Generated: 2026-06-08 from skillswap-production-seed.sql
-- Database: skillswap_db @ localhost:5432
-- =============================================================================
-- Lightweight demo seed: same users, profiles, relationships, and core content as
-- production seed, without audit logs, recommendation history, analytics, or
-- password-reset / notification history tables.
--
-- Column lists are aligned to the current PostgreSQL schema (orphan seed columns
-- such as student_profiles.notification_preferences are stripped automatically).
--
-- Usage in pgAdmin:
--   1. Ensure schema/migrations are already applied on the target database
--   2. Execute this entire script on a database with empty application tables
--
-- Contains:
--   * TRUNCATE TABLE ... RESTART IDENTITY CASCADE (demo tables only)
--   * INSERT statements preserving IDs and relationships from production seed
--
-- Excludes: __EFMigrationsHistory and non-essential supporting tables
-- =============================================================================

BEGIN;

TRUNCATE TABLE
  {",\n  ".join(INCLUDED)}
RESTART IDENTITY CASCADE;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
--
-- PostgreSQL database dump (demo subset)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
--
"""


def main() -> None:
    db_cols = load_db_columns()
    lines = SRC.read_text(encoding="utf-8").splitlines()
    out = [HEADER.rstrip("\n")]

    current_table: str | None = None
    include_section = True
    past_first_insert = False
    fixed_inserts = 0

    for line in lines:
        section_match = SECTION_RE.match(line)
        if section_match:
            current_table = section_match.group(1).strip()
            include_section = current_table not in EXCLUDED
            if include_section:
                out.append(line)
            continue

        if line.startswith("SELECT pg_catalog.setval"):
            seq_match = SETVAL_RE.search(line)
            if seq_match:
                seq = seq_match.group(1)
                if not any(frag in seq for frag in EXCLUDED_SEQ_FRAGMENTS):
                    out.append(line)
            continue

        if line == "-- PostgreSQL database dump complete":
            out.append("")
            out.append(line)
            out.append("")
            out.append("COMMIT;")
            out.append("")
            break

        if not include_section:
            continue

        if line.startswith("INSERT INTO"):
            past_first_insert = True
            original = line
            normalized = normalize_insert(line, db_cols)
            if normalized is None:
                continue
            if normalized != original:
                fixed_inserts += 1
            out.append(normalized)
        elif past_first_insert and line.strip() == "":
            out.append(line)

    DST.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Wrote {DST} ({len(out)} lines)")
    print(f"Included tables: {len(INCLUDED)}")
    print(f"Excluded tables: {len(EXCLUDED)}")
    print(f"Schema-aligned INSERT statements: {fixed_inserts}")


if __name__ == "__main__":
    main()
