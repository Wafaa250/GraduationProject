-- =============================================================================
-- NexusTech Solutions — production-style company seed (PostgreSQL)
-- =============================================================================
-- Run manually in psql / pgAdmin / DBeaver against your SkillSwap database.
-- Follows the same pattern as company-e2e-test-data.sql (no automatic startup).
--
-- Login (owner): careers@nexustech.ps / NexusTech2026!
--
-- Creates only:
--   - users (company owner)
--   - company_profiles
--   - company_members (owner)
--   - company_member_notification_preferences
--
-- Does NOT create posts, requests, invitations, or talent searches.
-- =============================================================================

BEGIN;

-- Optional cleanup (uncomment only to replace a previous run)
/*
DELETE FROM company_member_notification_preferences
WHERE company_profile_id IN (
  SELECT id FROM company_profiles WHERE normalized_company_name = 'nexustech solutions'
);
DELETE FROM company_members
WHERE company_profile_id IN (
  SELECT id FROM company_profiles WHERE normalized_company_name = 'nexustech solutions'
);
DELETE FROM company_profiles WHERE normalized_company_name = 'nexustech solutions';
DELETE FROM users WHERE email = 'careers@nexustech.ps';
*/

-- =============================================================================
-- Company owner account
-- =============================================================================
INSERT INTO users (name, email, password, role, must_change_password, created_at)
SELECT
  'Nadine Khoury',
  'careers@nexustech.ps',
  '$2a$11$XoNXhKV3j/uXdjxwrYn8buFJwF1AGuLROJpJWipVnqRN6hcawiF9i',
  'company',
  false,
  TIMESTAMPTZ '2026-03-15 08:00:00+00'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE lower(email) = 'careers@nexustech.ps'
);

-- =============================================================================
-- Company profile
-- Note: company_profiles has no logo_url column in the current schema.
-- Branding is represented via website_url and linkedin_url.
-- =============================================================================
INSERT INTO company_profiles (
  user_id,
  company_name,
  normalized_company_name,
  primary_email_domain,
  website_domain,
  industry,
  description,
  location,
  headquarters_location,
  working_style,
  areas_of_interest,
  website_url,
  linkedin_url,
  contact_email,
  optional_contact_link
)
SELECT
  u.id,
  'NexusTech Solutions',
  'nexustech solutions',
  'nexustech.ps',
  'nexustech.ps',
  'Software Development & Digital Transformation',
  'NexusTech Solutions is a technology company specializing in software engineering, web applications, mobile development, cloud infrastructure, artificial intelligence solutions, and digital transformation services. The company actively collaborates with universities and students to support innovation, professional development, and industry-academia partnerships.',
  'Ramallah, Palestine',
  'Ramallah, Palestine',
  'Hybrid',
  '["React","TypeScript","Angular",".NET","ASP.NET Core","PostgreSQL","Docker","Azure","AI","Machine Learning","Python","Node.js"]',
  'https://www.nexustech.ps',
  'https://www.linkedin.com/company/nexustech-solutions',
  'careers@nexustech.ps',
  'tel:+970599000000'
FROM users u
WHERE u.email = 'careers@nexustech.ps'
  AND NOT EXISTS (
    SELECT 1 FROM company_profiles cp WHERE cp.normalized_company_name = 'nexustech solutions'
  );

-- =============================================================================
-- Workspace owner membership
-- =============================================================================
INSERT INTO company_members (user_id, company_profile_id, role, created_at)
SELECT u.id, cp.id, 'owner', TIMESTAMPTZ '2026-03-15 08:05:00+00'
FROM users u
JOIN company_profiles cp ON cp.user_id = u.id
WHERE u.email = 'careers@nexustech.ps'
  AND NOT EXISTS (
    SELECT 1
    FROM company_members cm
    WHERE cm.user_id = u.id AND cm.company_profile_id = cp.id
  );

-- =============================================================================
-- Notification preferences (company settings)
-- =============================================================================
INSERT INTO company_member_notification_preferences (
  company_profile_id,
  user_id,
  notify_ai_recommendations,
  notify_saved_recommendations,
  notify_request_updates,
  notify_workspace_member_changes,
  updated_at
)
SELECT cp.id, u.id, true, true, true, true, TIMESTAMPTZ '2026-03-15 08:10:00+00'
FROM company_profiles cp
JOIN users u ON u.id = cp.user_id
WHERE cp.normalized_company_name = 'nexustech solutions'
  AND u.email = 'careers@nexustech.ps'
  AND NOT EXISTS (
    SELECT 1
    FROM company_member_notification_preferences p
    WHERE p.company_profile_id = cp.id AND p.user_id = u.id
  );

COMMIT;

-- =============================================================================
-- Quick verification
-- =============================================================================
SELECT
  u.id AS user_id,
  u.name AS owner_name,
  u.email,
  u.role,
  cp.id AS company_profile_id,
  cp.company_name,
  cp.industry,
  cp.location,
  cp.website_url,
  cp.contact_email,
  cp.areas_of_interest
FROM users u
JOIN company_profiles cp ON cp.user_id = u.id
WHERE cp.normalized_company_name = 'nexustech solutions';
