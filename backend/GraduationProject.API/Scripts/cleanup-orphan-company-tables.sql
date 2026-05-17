-- SkillSwap: remove company-module tables/columns left in PostgreSQL after code was deleted.
-- Run in pgAdmin Query Tool on your SkillSwap database (review first; backup if you have real data).

-- ── 1) Orphan tables (no longer in ApplicationDbContext) ─────────────────────
DROP TABLE IF EXISTS company_team_invitations CASCADE;
DROP TABLE IF EXISTS company_collaboration_requests CASCADE;
DROP TABLE IF EXISTS company_collaboration_needs CASCADE;

-- ── 2) Extra columns on company_profiles (old module; current model does not use) ─
ALTER TABLE company_profiles DROP COLUMN IF EXISTS collaboration_interests;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS collaboration_types;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS created_at;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS instagram_url;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS logo_base64;
ALTER TABLE company_profiles DROP COLUMN IF EXISTS skill_domains;

-- ── 3) Optional: old course invitation table if it still exists and is unused ─
-- DROP TABLE IF EXISTS course_team_invitations CASCADE;
