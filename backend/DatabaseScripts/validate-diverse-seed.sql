-- SkillSwap diverse seed validation (read-only)
\set ON_ERROR_STOP on

\echo '=== PROFILE COMPLETENESS ==='

SELECT 'students_without_profile' AS check_name,
       COUNT(*) AS failures
FROM users u
LEFT JOIN student_profiles sp ON sp.user_id = u.id
WHERE u.role = 'student' AND sp.id IS NULL;

SELECT 'doctors_without_profile' AS check_name,
       COUNT(*) AS failures
FROM users u
LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
WHERE u.role = 'doctor' AND dp.id IS NULL;

SELECT 'companies_without_profile' AS check_name,
       COUNT(*) AS failures
FROM users u
LEFT JOIN company_profiles cp ON cp.user_id = u.id
WHERE u.role = 'company' AND cp.id IS NULL;

SELECT 'associations_without_profile' AS check_name,
       COUNT(*) AS failures
FROM users u
LEFT JOIN student_association_profiles ap ON ap.user_id = u.id
WHERE u.role IN ('studentassociation', 'association') AND ap.id IS NULL;

SELECT 'company_members_without_membership' AS check_name,
       COUNT(*) AS failures
FROM users u
LEFT JOIN company_members cm ON cm.user_id = u.id
WHERE u.role = 'companymember' AND cm.id IS NULL;

\echo '=== UNIQUENESS ==='

SELECT 'duplicate_user_emails' AS check_name,
       COUNT(*) AS failures
FROM (
    SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1
) d;

SELECT 'duplicate_association_usernames' AS check_name,
       COUNT(*) AS failures
FROM (
    SELECT username FROM student_association_profiles GROUP BY username HAVING COUNT(*) > 1
) d;

SELECT 'duplicate_normalized_company_names' AS check_name,
       COUNT(*) AS failures
FROM (
    SELECT normalized_company_name FROM company_profiles GROUP BY normalized_company_name HAVING COUNT(*) > 1
) d;

\echo '=== ORPHAN / FK INTEGRITY ==='

SELECT 'student_profiles_orphan_user' AS check_name, COUNT(*) AS failures
FROM student_profiles sp LEFT JOIN users u ON u.id = sp.user_id WHERE u.id IS NULL;

SELECT 'doctor_profiles_orphan_user' AS check_name, COUNT(*) AS failures
FROM doctor_profiles dp LEFT JOIN users u ON u.id = dp.user_id WHERE u.id IS NULL;

SELECT 'company_profiles_orphan_user' AS check_name, COUNT(*) AS failures
FROM company_profiles cp LEFT JOIN users u ON u.id = cp.user_id WHERE u.id IS NULL;

SELECT 'company_members_orphan_user' AS check_name, COUNT(*) AS failures
FROM company_members cm LEFT JOIN users u ON u.id = cm.user_id WHERE u.id IS NULL;

SELECT 'company_members_orphan_company' AS check_name, COUNT(*) AS failures
FROM company_members cm LEFT JOIN company_profiles cp ON cp.id = cm.company_profile_id WHERE cp.id IS NULL;

SELECT 'student_skills_orphan_student' AS check_name, COUNT(*) AS failures
FROM student_skills ss LEFT JOIN student_profiles sp ON sp.id = ss.student_id WHERE sp.id IS NULL;

SELECT 'student_skills_orphan_skill' AS check_name, COUNT(*) AS failures
FROM student_skills ss LEFT JOIN skills s ON s.id = ss.skill_id WHERE s.id IS NULL;

SELECT 'graduation_projects_orphan_owner' AS check_name, COUNT(*) AS failures
FROM graduation_projects gp LEFT JOIN student_profiles sp ON sp.id = gp.owner_id WHERE sp.id IS NULL;

SELECT 'graduation_projects_orphan_supervisor' AS check_name, COUNT(*) AS failures
FROM graduation_projects gp LEFT JOIN doctor_profiles dp ON dp.id = gp.supervisor_id
WHERE gp.supervisor_id IS NOT NULL AND dp.id IS NULL;

SELECT 'graduation_project_members_orphan' AS check_name, COUNT(*) AS failures
FROM graduation_project_members m
LEFT JOIN graduation_projects gp ON gp.id = m.project_id
LEFT JOIN student_profiles sp ON sp.id = m.student_id
WHERE gp.id IS NULL OR sp.id IS NULL;

SELECT 'project_invitations_orphan' AS check_name, COUNT(*) AS failures
FROM project_invitations pi
LEFT JOIN graduation_projects gp ON gp.id = pi.project_id
LEFT JOIN student_profiles s1 ON s1.id = pi.sender_id
LEFT JOIN student_profiles s2 ON s2.id = pi.receiver_id
WHERE gp.id IS NULL OR s1.id IS NULL OR s2.id IS NULL;

SELECT 'supervisor_requests_orphan' AS check_name, COUNT(*) AS failures
FROM supervisor_requests sr
LEFT JOIN graduation_projects gp ON gp.id = sr.project_id
LEFT JOIN doctor_profiles dp ON dp.id = sr.doctor_id
LEFT JOIN student_profiles sp ON sp.id = sr.sender_id
WHERE gp.id IS NULL OR dp.id IS NULL OR sp.id IS NULL;

SELECT 'courses_orphan_doctor' AS check_name, COUNT(*) AS failures
FROM courses c LEFT JOIN doctor_profiles dp ON dp.id = c."DoctorId" WHERE dp.id IS NULL;

SELECT 'section_enrollments_orphan' AS check_name, COUNT(*) AS failures
FROM section_enrollments e
LEFT JOIN course_sections cs ON cs."Id" = e."CourseSectionId"
LEFT JOIN student_profiles sp ON sp.id = e."StudentProfileId"
WHERE cs."Id" IS NULL OR sp.id IS NULL;

SELECT 'course_team_members_orphan_team' AS check_name, COUNT(*) AS failures
FROM course_team_members ctm
LEFT JOIN course_teams ct ON ct."Id" = ctm."CourseTeamId"
WHERE ct."Id" IS NULL;

SELECT 'course_team_members_orphan_student' AS check_name, COUNT(*) AS failures
FROM course_team_members ctm
LEFT JOIN student_profiles sp ON sp.id = ctm."StudentProfileId"
WHERE sp.id IS NULL;

SELECT 'course_team_members_user_mismatch' AS check_name, COUNT(*) AS failures
FROM course_team_members ctm
JOIN student_profiles sp ON sp.id = ctm."StudentProfileId"
WHERE ctm."UserId" <> sp.user_id;

SELECT 'conversation_users_orphan_conversation' AS check_name, COUNT(*) AS failures
FROM conversation_users cu
LEFT JOIN conversations c ON c."Id" = cu."ConversationId"
WHERE c."Id" IS NULL;

SELECT 'conversation_users_orphan_user' AS check_name, COUNT(*) AS failures
FROM conversation_users cu
LEFT JOIN users u ON u.id = cu."UserId"
WHERE u.id IS NULL;

SELECT 'messages_orphan_conversation' AS check_name, COUNT(*) AS failures
FROM messages m
LEFT JOIN conversations c ON c."Id" = m."ConversationId"
WHERE c."Id" IS NULL;

SELECT 'messages_orphan_sender' AS check_name, COUNT(*) AS failures
FROM messages m
LEFT JOIN users u ON u.id = m."SenderId"
WHERE u.id IS NULL;

SELECT 'company_request_recommendations_orphan' AS check_name, COUNT(*) AS failures
FROM company_request_recommendations r
LEFT JOIN company_request_recommendation_runs run ON run.id = r.run_id
LEFT JOIN company_requests cr ON cr.id = r.company_request_id
LEFT JOIN student_profiles sp ON sp.id = r.student_profile_id
WHERE run.id IS NULL OR cr.id IS NULL OR sp.id IS NULL;

SELECT 'company_request_team_recommendations_orphan' AS check_name, COUNT(*) AS failures
FROM company_request_team_recommendations tr
LEFT JOIN company_request_team_recommendation_runs run ON run.id = tr.run_id
LEFT JOIN company_requests cr ON cr.id = tr.company_request_id
WHERE run.id IS NULL OR cr.id IS NULL;

SELECT 'company_request_team_rec_members_orphan' AS check_name, COUNT(*) AS failures
FROM company_request_team_recommendation_members m
LEFT JOIN company_request_team_recommendations tr ON tr.id = m.team_recommendation_id
LEFT JOIN company_request_roles r ON r.id = m.company_request_role_id
LEFT JOIN student_profiles sp ON sp.id = m.student_profile_id
WHERE tr.id IS NULL OR r.id IS NULL OR sp.id IS NULL;

SELECT 'company_saved_student_recommendations_orphan' AS check_name, COUNT(*) AS failures
FROM company_saved_student_recommendations s
LEFT JOIN company_profiles cp ON cp.id = s.company_profile_id
LEFT JOIN company_requests cr ON cr.id = s.company_request_id
LEFT JOIN student_profiles sp ON sp.id = s.student_profile_id
LEFT JOIN users u ON u.id = s.saved_by_user_id
WHERE cp.id IS NULL OR cr.id IS NULL OR sp.id IS NULL OR u.id IS NULL;

SELECT 'org_event_registrations_orphan' AS check_name, COUNT(*) AS failures
FROM student_organization_event_registrations r
LEFT JOIN student_organization_events e ON e.id = r.event_id
LEFT JOIN student_profiles sp ON sp.id = r.student_profile_id
LEFT JOIN student_association_profiles ap ON ap.id = r.organization_profile_id
WHERE e.id IS NULL OR sp.id IS NULL OR ap.id IS NULL;

SELECT 'org_recruitment_applications_orphan' AS check_name, COUNT(*) AS failures
FROM student_organization_recruitment_applications a
LEFT JOIN student_profiles sp ON sp.id = a.student_profile_id
LEFT JOIN student_association_profiles ap ON ap.id = a.organization_profile_id
LEFT JOIN student_organization_recruitment_campaigns c ON c.id = a.campaign_id
LEFT JOIN student_organization_recruitment_positions p ON p.id = a.position_id
WHERE sp.id IS NULL OR ap.id IS NULL OR c.id IS NULL OR p.id IS NULL;

\echo '=== SUMMARY COUNTS ==='
SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role;
SELECT 'student_profiles' t, COUNT(*) FROM student_profiles
UNION ALL SELECT 'company_profiles', COUNT(*) FROM company_profiles
UNION ALL SELECT 'student_association_profiles', COUNT(*) FROM student_association_profiles
UNION ALL SELECT 'section_enrollments', COUNT(*) FROM section_enrollments
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'company_request_recommendations', COUNT(*) FROM company_request_recommendations
UNION ALL SELECT 'student_organization_events', COUNT(*) FROM student_organization_events
UNION ALL SELECT 'graduation_projects', COUNT(*) FROM graduation_projects;
