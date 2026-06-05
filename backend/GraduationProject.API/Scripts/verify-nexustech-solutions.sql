-- Verify NexusTech Solutions seed data
SELECT 'users' AS section, u.id, u.name, u.email, u.role
FROM users u
WHERE lower(u.email) = 'careers@nexustech.ps';

SELECT 'company_profiles' AS section, cp.*
FROM company_profiles cp
WHERE cp.normalized_company_name = 'nexustech solutions';

SELECT 'company_members' AS section, cm.*
FROM company_members cm
JOIN company_profiles cp ON cp.id = cm.company_profile_id
WHERE cp.normalized_company_name = 'nexustech solutions';

SELECT 'notification_preferences' AS section, p.*
FROM company_member_notification_preferences p
JOIN company_profiles cp ON cp.id = p.company_profile_id
WHERE cp.normalized_company_name = 'nexustech solutions';

-- Discovery/search readiness
SELECT
  cp.id,
  cp.company_name,
  cp.industry,
  left(cp.description, 80) AS description_preview,
  cp.areas_of_interest,
  cp.website_url,
  cp.linkedin_url,
  cp.contact_email
FROM company_profiles cp
WHERE cp.normalized_company_name = 'nexustech solutions';
