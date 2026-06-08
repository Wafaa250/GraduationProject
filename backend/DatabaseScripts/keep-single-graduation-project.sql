-- =============================================================================
-- Keep ONLY graduation project:
--   "AI-Powered Graduation Project Collaboration Platform"
-- =============================================================================
-- - Resolves target project by name (never by hardcoded ID)
-- - Deletes all other graduation projects and their dependent rows
-- - Does NOT modify users, students, doctors, companies, courses, messages, etc.
-- - Safe to run in a transaction; aborts if target project is missing or duplicated
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- PRE-CLEANUP VERIFICATION
-- ---------------------------------------------------------------------------
SELECT '=== PRE-CLEANUP: total graduation projects ===' AS report;
SELECT COUNT(*) AS total_graduation_projects FROM graduation_projects;

SELECT '=== PRE-CLEANUP: all graduation projects ===' AS report;
SELECT id, name, owner_id, supervisor_id, project_type, partners_count, created_at
FROM graduation_projects
ORDER BY id;

-- ---------------------------------------------------------------------------
-- RESOLVE TARGET PROJECT BY NAME
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _gp_keep (
    keep_id   INT  PRIMARY KEY,
    keep_name TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO _gp_keep (keep_id, keep_name)
SELECT id, name
FROM graduation_projects
WHERE name = 'AI-Powered Graduation Project Collaboration Platform';

DO $$
DECLARE
    match_count INT;
    keep_name   CONSTANT TEXT := 'AI-Powered Graduation Project Collaboration Platform';
BEGIN
    SELECT COUNT(*) INTO match_count
    FROM graduation_projects
    WHERE name = keep_name;

    IF match_count = 0 THEN
        RAISE EXCEPTION
            'ABORT: No graduation project found with name "%". Nothing was deleted.',
            keep_name;
    ELSIF match_count > 1 THEN
        RAISE EXCEPTION
            'ABORT: Found % projects named "%". Resolve duplicates before running.',
            match_count, keep_name;
    END IF;
END $$;

CREATE TEMP TABLE _gp_delete (
    project_id INT PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO _gp_delete (project_id)
SELECT gp.id
FROM graduation_projects gp
WHERE NOT EXISTS (SELECT 1 FROM _gp_keep k WHERE k.keep_id = gp.id);

SELECT '=== Projects scheduled for deletion ===' AS report;
SELECT d.project_id, gp.name
FROM _gp_delete d
JOIN graduation_projects gp ON gp.id = d.project_id
ORDER BY d.project_id;

-- ---------------------------------------------------------------------------
-- DELETE NON-FK DEPENDENTS (no FK constraint to graduation_projects)
-- ---------------------------------------------------------------------------

-- Graduation-project notifications reference project_id without an FK.
DELETE FROM user_notifications un
WHERE un.project_id IN (SELECT project_id FROM _gp_delete);

-- Polymorphic recommendation cache rows (defensive; seed uses company_request only).
DELETE FROM recommendation_semantic_embeddings rse
WHERE rse.scope_type IN ('graduation_project', 'graduation_projects', 'student_project')
  AND rse.scope_id IN (SELECT project_id FROM _gp_delete);

-- Legacy milestones table (present in some databases, not in current EF model).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'graduation_project_milestones'
    ) THEN
        EXECUTE $sql$
            DELETE FROM graduation_project_milestones
            WHERE project_id IN (SELECT project_id FROM _gp_delete)
        $sql$;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- DELETE FK-DEPENDENT ROWS (explicit order; parent delete also CASCADEs)
-- ---------------------------------------------------------------------------
DELETE FROM supervisor_cancellation_requests
WHERE project_id IN (SELECT project_id FROM _gp_delete);

DELETE FROM supervisor_requests
WHERE project_id IN (SELECT project_id FROM _gp_delete);

DELETE FROM project_invitations
WHERE project_id IN (SELECT project_id FROM _gp_delete);

DELETE FROM graduation_project_members
WHERE project_id IN (SELECT project_id FROM _gp_delete);

DELETE FROM graduation_projects
WHERE id IN (SELECT project_id FROM _gp_delete);

-- ---------------------------------------------------------------------------
-- POST-CLEANUP VERIFICATION
-- ---------------------------------------------------------------------------
SELECT '=== POST-CLEANUP: total graduation projects ===' AS report;
SELECT COUNT(*) AS total_graduation_projects FROM graduation_projects;

SELECT '=== POST-CLEANUP: remaining project name ===' AS report;
SELECT id, name
FROM graduation_projects;

SELECT '=== POST-CLEANUP: kept project related row counts ===' AS report;
SELECT
    (SELECT COUNT(*) FROM graduation_project_members gpm
     JOIN _gp_keep k ON k.keep_id = gpm.project_id) AS members,
    (SELECT COUNT(*) FROM project_invitations pi
     JOIN _gp_keep k ON k.keep_id = pi.project_id) AS invitations,
    (SELECT COUNT(*) FROM supervisor_requests sr
     JOIN _gp_keep k ON k.keep_id = sr.project_id) AS supervisor_requests,
    (SELECT COUNT(*) FROM supervisor_cancellation_requests scr
     JOIN _gp_keep k ON k.keep_id = scr.project_id) AS supervisor_cancellation_requests,
    (SELECT COUNT(*) FROM user_notifications un
     JOIN _gp_keep k ON k.keep_id = un.project_id) AS notifications;

-- Orphan checks (must all be zero)
SELECT '=== ORPHAN CHECKS (expect 0 for every row) ===' AS report;
SELECT 'graduation_project_members' AS table_name, COUNT(*) AS orphan_count
FROM graduation_project_members gpm
WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = gpm.project_id)
UNION ALL
SELECT 'project_invitations', COUNT(*)
FROM project_invitations pi
WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = pi.project_id)
UNION ALL
SELECT 'supervisor_requests', COUNT(*)
FROM supervisor_requests sr
WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = sr.project_id)
UNION ALL
SELECT 'supervisor_cancellation_requests', COUNT(*)
FROM supervisor_cancellation_requests scr
WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = scr.project_id)
UNION ALL
SELECT 'user_notifications (project_id)', COUNT(*)
FROM user_notifications un
WHERE un.project_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = un.project_id)
UNION ALL
SELECT 'recommendation_semantic_embeddings (gp scope)', COUNT(*)
FROM recommendation_semantic_embeddings rse
WHERE rse.scope_type IN ('graduation_project', 'graduation_projects', 'student_project')
  AND NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = rse.scope_id);

DO $$
DECLARE
    remaining   INT;
    name_check  TEXT;
    orphan_sum  BIGINT;
    expected    CONSTANT TEXT := 'AI-Powered Graduation Project Collaboration Platform';
BEGIN
    SELECT COUNT(*), MAX(name) INTO remaining, name_check FROM graduation_projects;

    IF remaining <> 1 THEN
        RAISE EXCEPTION
            'VERIFICATION FAILED: Expected exactly 1 graduation project, found %.',
            remaining;
    END IF;

    IF name_check IS DISTINCT FROM expected THEN
        RAISE EXCEPTION
            'VERIFICATION FAILED: Remaining project name is "%", expected "%".',
            name_check, expected;
    END IF;

    SELECT
        (SELECT COUNT(*) FROM graduation_project_members gpm
         WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = gpm.project_id))
      + (SELECT COUNT(*) FROM project_invitations pi
         WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = pi.project_id))
      + (SELECT COUNT(*) FROM supervisor_requests sr
         WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = sr.project_id))
      + (SELECT COUNT(*) FROM supervisor_cancellation_requests scr
         WHERE NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = scr.project_id))
      + (SELECT COUNT(*) FROM user_notifications un
         WHERE un.project_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM graduation_projects gp WHERE gp.id = un.project_id))
    INTO orphan_sum;

    IF orphan_sum > 0 THEN
        RAISE EXCEPTION
            'VERIFICATION FAILED: Found % orphaned graduation-project-related row(s).',
            orphan_sum;
    END IF;
END $$;

COMMIT;
