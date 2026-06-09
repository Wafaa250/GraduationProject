-- =============================================================================
-- SkillSwap: FULL DATA RESET — truncate all application data
-- =============================================================================
--
-- Purpose:
--   Remove every row from all application tables while keeping the database
--   structure completely intact.
--
-- Preserved (NOT modified):
--   - Database, schema, tables, columns, indexes, constraints, foreign keys
--   - EF Core migration history (__EFMigrationsHistory)
--
-- NOT performed:
--   - DROP TABLE / DROP DATABASE
--   - Migration file changes
--   - __EFMigrationsHistory deletion or truncation
--
-- Usage (pgAdmin):
--   1. Connect to database: skillswap_db
--   2. Open this script in Query Tool
--   3. Execute the entire script (F5)
--   4. Run the VERIFICATION section at the bottom and confirm 0 non-empty tables
--
-- Generated from live schema analysis on 2026-06-09.
-- Application tables cleared: 64
-- =============================================================================

BEGIN;

TRUNCATE TABLE
  company_activity_logs,
  company_follows,
  company_member_notification_preferences,
  company_members,
  company_profiles,
  company_request_invitations,
  company_request_recommendation_runs,
  company_request_recommendations,
  company_request_roles,
  company_request_skills,
  company_request_team_recommendation_members,
  company_request_team_recommendation_runs,
  company_request_team_recommendations,
  company_requests,
  company_saved_student_recommendations,
  company_saved_team_recommendations,
  company_talent_requests,
  conversation_users,
  conversations,
  course_project_sections,
  course_projects,
  course_sections,
  course_team_invitations,
  course_team_members,
  course_team_messages,
  course_teams,
  courses,
  doctor_posts,
  doctor_profiles,
  feed_post_comments,
  feed_post_engagements,
  graduation_project_members,
  graduation_project_milestones,
  graduation_projects,
  messages,
  organization_follows,
  password_reset_codes,
  password_reset_tokens,
  project_invitations,
  recommendation_semantic_embeddings,
  section_chat_messages,
  section_enrollments,
  skills,
  student_association_profiles,
  student_organization_event_registration_answers,
  student_organization_event_registration_fields,
  student_organization_event_registration_forms,
  student_organization_event_registrations,
  student_organization_events,
  student_organization_members,
  student_organization_recruitment_applicant_analyses,
  student_organization_recruitment_application_answers,
  student_organization_recruitment_applications,
  student_organization_recruitment_campaigns,
  student_organization_recruitment_positions,
  student_organization_recruitment_questions,
  student_organization_team_members,
  student_posts,
  student_profiles,
  student_skills,
  supervisor_cancellation_requests,
  supervisor_requests,
  user_notifications,
  users
RESTART IDENTITY CASCADE;

COMMIT;

-- =============================================================================
-- VERIFICATION (run after truncate)
-- =============================================================================

-- 1) Confirm migration history is still present (should return >= 1 row)
SELECT COUNT(*) AS migration_history_rows
FROM "__EFMigrationsHistory";

-- 2) List any application tables that still contain data (should return 0 rows)
SELECT
  t.table_name,
  (xpath('/row/cnt/text()', xml))[1]::text::bigint AS row_count
FROM information_schema.tables t
CROSS JOIN LATERAL (
  SELECT query_to_xml(
    format('SELECT COUNT(*) AS cnt FROM %I.%I', t.table_schema, t.table_name),
    false,
    true,
    ''
  ) AS xml
) counts
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name <> '__EFMigrationsHistory'
  AND (xpath('/row/cnt/text()', xml))[1]::text::bigint > 0
ORDER BY t.table_name;

-- 3) Summary: total rows across all application tables (should be 0)
SELECT COALESCE(SUM(row_count), 0) AS total_application_rows_remaining
FROM (
  SELECT
    (xpath('/row/cnt/text()', xml))[1]::text::bigint AS row_count
  FROM information_schema.tables t
  CROSS JOIN LATERAL (
    SELECT query_to_xml(
      format('SELECT COUNT(*) AS cnt FROM %I.%I', t.table_schema, t.table_name),
      false,
      true,
      ''
    ) AS xml
  ) counts
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name <> '__EFMigrationsHistory'
) counts;

-- 4) Per-table row counts (all should be 0; useful for manual inspection)
SELECT
  t.table_name,
  (xpath('/row/cnt/text()', xml))[1]::text::bigint AS row_count
FROM information_schema.tables t
CROSS JOIN LATERAL (
  SELECT query_to_xml(
    format('SELECT COUNT(*) AS cnt FROM %I.%I', t.table_schema, t.table_name),
    false,
    true,
    ''
  ) AS xml
) counts
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name <> '__EFMigrationsHistory'
ORDER BY t.table_name;
