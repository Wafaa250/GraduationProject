-- Remove Helix Martin Systems E2E test company and its workspace accounts.
-- Safe to run multiple times (no-op if already removed).

BEGIN;

DELETE FROM company_follows
WHERE company_profile_id IN (
  SELECT id FROM company_profiles WHERE normalized_company_name = 'helix martin systems'
);

DELETE FROM company_profiles
WHERE normalized_company_name = 'helix martin systems';

DELETE FROM users
WHERE email IN (
  'marcus.chen+e2e@helixmartin.com',
  'priya.sharma+e2e@helixmartin.com'
);

COMMIT;
