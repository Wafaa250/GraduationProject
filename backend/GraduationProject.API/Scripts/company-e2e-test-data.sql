-- =============================================================================
-- Helix Martin Systems — Company module E2E test data (PostgreSQL)
-- =============================================================================
-- Run manually in psql / pgAdmin / DBeaver against your SkillSwap database.
-- Does NOT run automatically. No backend/frontend changes.
--
-- Login (owner):  marcus.chen+e2e@helixmartin.com  /  NexusFlow2026!
-- Login (member): priya.sharma+e2e@helixmartin.com /  NexusMember2026!
--
-- If inserts fail on unique email/domain/name, change the +e2e@ addresses or
-- company/website values below, or run the optional cleanup block first.
-- =============================================================================

BEGIN;

-- Optional cleanup (uncomment to remove a previous run of this script)
/*
DELETE FROM users
WHERE email IN (
  'marcus.chen+e2e@helixmartin.com',
  'priya.sharma+e2e@helixmartin.com',
  'aisha.kamal+e2e@gmail.com',
  'omar.hassan+e2e@gmail.com',
  'layla.nasser+e2e@gmail.com',
  'youssef.ali+e2e@gmail.com',
  'sara.itani+e2e@gmail.com'
);
*/

-- =============================================================================
-- Company User (owner)
-- =============================================================================
INSERT INTO users (name, email, password, role, must_change_password, created_at)
VALUES (
  'Marcus Chen',
  'marcus.chen+e2e@helixmartin.com',
  '$2a$11$5lQARt.0CzbCkNHdHYsJPuvHkqG/HClO82Odpgib685TresK13Joy',
  'company',
  false,
  TIMESTAMPTZ '2026-01-12 09:00:00+00'
);

-- =============================================================================
-- Company Profile (no logo_url column in schema)
-- =============================================================================
INSERT INTO company_profiles (
  user_id, company_name, normalized_company_name, primary_email_domain, website_domain,
  industry, description, location, headquarters_location, working_style, areas_of_interest,
  website_url, linkedin_url, contact_email, optional_contact_link
)
SELECT
  u.id,
  'Helix Martin Systems',
  'helix martin systems',
  'helixmartin.com',
  'helixmartin.com',
  'Industrial IoT & Predictive Analytics',
  'Helix Martin Systems partners with An-Najah National University to deliver predictive maintenance, field-service mobile apps, and analytics platforms for mid-market manufacturers across MENA and Europe.',
  'Dubai, United Arab Emirates',
  'Dubai, United Arab Emirates',
  'Hybrid-first',
  'Predictive maintenance,Edge IoT,Mobile field service,Data platforms',
  'https://www.helixmartin.com',
  'https://www.linkedin.com/company/helix-martin-systems',
  'talent.partnerships@helixmartin.com',
  'https://cal.com/helixmartin/partnerships'
FROM users u
WHERE u.email = 'marcus.chen+e2e@helixmartin.com';

-- =============================================================================
-- Workspace: owner membership + second member + notification preferences
-- =============================================================================
INSERT INTO company_members (user_id, company_profile_id, role, created_at)
SELECT u.id, cp.id, 'owner', TIMESTAMPTZ '2026-01-12 09:05:00+00'
FROM users u
JOIN company_profiles cp ON cp.user_id = u.id
WHERE u.email = 'marcus.chen+e2e@helixmartin.com';

INSERT INTO users (name, email, password, role, must_change_password, created_at)
VALUES (
  'Priya Sharma',
  'priya.sharma+e2e@helixmartin.com',
  '$2a$11$Ao8pBmq61dKgw7gA6Foq4eKMx5I6VMkYjG6oWR0qd3BpD2lB0eWCu',
  'company',
  true,
  TIMESTAMPTZ '2026-02-03 11:00:00+00'
);

INSERT INTO company_members (user_id, company_profile_id, role, created_at)
SELECT u.id, cp.id, 'member', TIMESTAMPTZ '2026-02-03 11:05:00+00'
FROM users u
CROSS JOIN company_profiles cp
WHERE u.email = 'priya.sharma+e2e@helixmartin.com'
  AND cp.normalized_company_name = 'helix martin systems';

INSERT INTO company_member_notification_preferences (
  company_profile_id, user_id,
  notify_ai_recommendations, notify_saved_recommendations,
  notify_request_updates, notify_workspace_member_changes, updated_at
)
SELECT cp.id, u.id, true, true, true, true, TIMESTAMPTZ '2026-05-01 08:00:00+00'
FROM company_profiles cp
JOIN users u ON u.email IN ('marcus.chen+e2e@helixmartin.com', 'priya.sharma+e2e@helixmartin.com')
WHERE cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Student accounts (FK targets for invitations & recommendations)
-- =============================================================================
INSERT INTO users (name, email, password, role, must_change_password, created_at) VALUES
  ('Aisha Kamal',   'aisha.kamal+e2e@gmail.com',   '$2a$11$5lQARt.0CzbCkNHdHYsJPuvHkqG/HClO82Odpgib685TresK13Joy', 'student', false, TIMESTAMPTZ '2025-09-01 08:00:00+00'),
  ('Omar Hassan',   'omar.hassan+e2e@gmail.com',   '$2a$11$5lQARt.0CzbCkNHdHYsJPuvHkqG/HClO82Odpgib685TresK13Joy', 'student', false, TIMESTAMPTZ '2025-09-01 08:10:00+00'),
  ('Layla Nasser',  'layla.nasser+e2e@gmail.com',  '$2a$11$5lQARt.0CzbCkNHdHYsJPuvHkqG/HClO82Odpgib685TresK13Joy', 'student', false, TIMESTAMPTZ '2025-09-01 08:20:00+00'),
  ('Youssef Ali',   'youssef.ali+e2e@gmail.com',   '$2a$11$5lQARt.0CzbCkNHdHYsJPuvHkqG/HClO82Odpgib685TresK13Joy', 'student', false, TIMESTAMPTZ '2025-09-01 08:30:00+00'),
  ('Sara Itani',    'sara.itani+e2e@gmail.com',    '$2a$11$5lQARt.0CzbCkNHdHYsJPuvHkqG/HClO82Odpgib685TresK13Joy', 'student', false, TIMESTAMPTZ '2025-09-01 08:40:00+00');

INSERT INTO student_profiles (
  user_id, major, bio, student_id, university, faculty, academic_year, gpa,
  availability, looking_for, github, linkedin, portfolio,
  languages, tools, roles, technical_skills
)
SELECT u.id,
  v.major, v.bio, v.student_id, 'An-Najah National University', 'Faculty of Engineering and Information Technology', v.year, v.gpa,
  'Available from June 2026', 'Graduation project / internship',
  v.github, v.linkedin, v.portfolio,
  v.languages, v.tools, v.roles, v.skills
FROM users u
JOIN (VALUES
  ('aisha.kamal+e2e@gmail.com',  'Computer Engineering', 'Final-year student focused on Flutter and Firebase for industrial mobile apps.', '202210451', 'Senior', 3.72,
   'https://github.com/aisha-kamal-dev', 'https://linkedin.com/in/aishakamal', 'https://aishakamal.dev',
   '["English","Arabic"]', '["Flutter","Firebase","Figma"]', '["Mobile Developer"]', '["Flutter","Firebase","Dart","REST APIs"]'),
  ('omar.hassan+e2e@gmail.com',    'Software Engineering', 'Backend-oriented developer with Azure IoT Hub and .NET experience.', '202210883', 'Senior', 3.55,
   'https://github.com/omar-hassan-iot', 'https://linkedin.com/in/omarhassan', NULL,
   '["English","Arabic"]', '["C#","Azure","Docker"]', '["Backend Developer"]', '["C#","ASP.NET Core","Azure IoT Hub","SQL Server"]'),
  ('layla.nasser+e2e@gmail.com',   'Data Science', 'Analyst building dashboards with Python, SQL, and Power BI.', '202311204', 'Junior', 3.68,
   'https://github.com/layla-nasser', 'https://linkedin.com/in/laylanasser', NULL,
   '["English","French"]', '["Python","Power BI","PostgreSQL"]', '["Data Analyst"]', '["Python","SQL","Power BI","Statistical Analysis"]'),
  ('youssef.ali+e2e@gmail.com',    'Computer Science', 'Full-stack student with React and Node.js project experience.', '202410019', 'Sophomore', 3.41,
   'https://github.com/youssef-ali-fs', NULL, 'https://youssefali.me',
   '["English","Arabic"]', '["React","Node.js","PostgreSQL"]', '["Full-Stack Developer"]', '["React","Node.js","TypeScript","PostgreSQL"]'),
  ('sara.itani+e2e@gmail.com',     'UX Design', 'Product designer with user research and prototyping skills.', '202310772', 'Senior', 3.64,
   NULL, 'https://linkedin.com/in/saraitani', 'https://behance.net/saraitani',
   '["English","Arabic"]', '["Figma","Miro"]', '["UX Designer"]', '["User Research","Wireframing","Prototyping","Design Systems"]')
) AS v(email, major, bio, student_id, year, gpa, github, linkedin, portfolio, languages, tools, roles, skills)
  ON v.email = u.email;

-- =============================================================================
-- Company Opportunities (company_requests) — statuses & lifecycle for filters
-- Constraint: at most ONE draft per company_profile_id
-- =============================================================================
INSERT INTO company_requests (
  company_profile_id, request_type, status, request_status, wizard_step,
  title, description, category, category_choice, category_other,
  duration_ongoing, duration_value, duration_unit, duration_label,
  collaboration_format, scope_notes,
  created_at, updated_at, submitted_at, created_by_user_id, updated_by_user_id
)
SELECT cp.id, v.request_type, v.status, v.request_status, v.wizard_step,
  v.title, v.description, v.category, v.category_choice, NULL,
  v.duration_ongoing, v.duration_value, v.duration_unit, v.duration_label,
  v.collaboration_format, v.scope_notes,
  v.created_at, v.updated_at, v.submitted_at, owner.id, owner.id
FROM company_profiles cp
JOIN users owner ON owner.id = cp.user_id
CROSS JOIN (VALUES
  ('individual', 'draft', 'active', 2,
   'Warehouse IoT Dashboard (Draft)',
   'Draft wizard state for testing save/resume. Sensor telemetry dashboard for regional warehouses.',
   'Software & Technology', 'Software & Technology',
   false, 4, 'Months', '4 months', 'hybrid', 'PII-safe telemetry only',
   TIMESTAMPTZ '2026-05-28 14:00:00+00', TIMESTAMPTZ '2026-05-30 10:00:00+00', NULL),
  ('individual', 'submitted', 'active', NULL,
   'Predictive Maintenance MVP',
   'Build an MVP that ingests machine vibration data, surfaces failure risk scores, and alerts maintenance supervisors via web dashboard.',
   'AI & Machine Learning', 'AI & Machine Learning',
   false, 6, 'Months', '6 months', 'hybrid', 'Weekly stakeholder demo; Azure subscription provided',
   TIMESTAMPTZ '2026-03-10 09:00:00+00', TIMESTAMPTZ '2026-05-20 16:00:00+00', TIMESTAMPTZ '2026-03-10 10:00:00+00'),
  ('ai-built-team', 'submitted', 'active', NULL,
   'Customer Analytics Platform',
   'Cross-functional team to deliver a customer 360 analytics portal with ETL pipelines, API layer, and executive dashboards.',
   'Data Science & Analytics', 'Data Science & Analytics',
   false, 2, 'Semesters', '2 semesters', 'remote', 'NDA required; sample data provided',
   TIMESTAMPTZ '2026-02-15 08:00:00+00', TIMESTAMPTZ '2026-05-18 12:00:00+00', TIMESTAMPTZ '2026-02-15 09:30:00+00'),
  ('individual', 'submitted', 'paused', NULL,
   'Mobile Field Service App',
   'Flutter app for technicians: work orders, offline sync, photo capture, and signature collection.',
   'Web & Mobile Applications', 'Web & Mobile Applications',
   false, 3, 'Months', '3 months', 'remote', 'Paused pending client API credentials',
   TIMESTAMPTZ '2026-01-20 11:00:00+00', TIMESTAMPTZ '2026-04-02 09:00:00+00', TIMESTAMPTZ '2026-01-21 08:00:00+00'),
  ('individual', 'submitted', 'closed', NULL,
   'Legacy ERP Integration Module',
   'Closed engagement: SOAP integration between shop-floor terminals and legacy ERP inventory module.',
   'Software & Technology', 'Software & Technology',
   false, 8, 'Weeks', '8 weeks', 'on-site', 'Completed Q1 2026',
   TIMESTAMPTZ '2025-11-05 10:00:00+00', TIMESTAMPTZ '2026-03-01 17:00:00+00', TIMESTAMPTZ '2025-11-06 09:00:00+00'),
  ('individual', 'archived', 'active', NULL,
   'Prototype Chatbot Pilot',
   'Archived pilot for internal HR policy Q&A chatbot using retrieval-augmented generation.',
   'AI & Machine Learning', 'AI & Machine Learning',
   true, NULL, NULL, 'Ongoing', 'flexible', 'Pilot concluded; kept for historical reporting',
   TIMESTAMPTZ '2025-08-01 08:00:00+00', TIMESTAMPTZ '2026-01-10 12:00:00+00', TIMESTAMPTZ '2025-08-02 10:00:00+00')
) AS v(request_type, status, request_status, wizard_step, title, description, category, category_choice,
       duration_ongoing, duration_value, duration_unit, duration_label, collaboration_format, scope_notes,
       created_at, updated_at, submitted_at)
WHERE cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Roles & skills (per request)
-- =============================================================================
INSERT INTO company_request_roles (company_request_id, client_role_key, sort_order, role_name, notes)
SELECT cr.id, v.client_key, v.sort_order, v.role_name, v.notes
FROM company_requests cr
JOIN company_profiles cp ON cp.id = cr.company_profile_id
JOIN (VALUES
  ('Predictive Maintenance MVP', 'role-iot-1', 0, 'IoT Software Engineer', 'Azure IoT + .NET APIs'),
  ('Customer Analytics Platform', 'role-be-1', 0, 'Backend Engineer', 'ETL and REST services'),
  ('Customer Analytics Platform', 'role-da-1', 1, 'Data Analyst', 'Dashboards and KPI definitions'),
  ('Customer Analytics Platform', 'role-ux-1', 2, 'Product Designer', 'Executive dashboard UX'),
  ('Mobile Field Service App', 'role-mob-1', 0, 'Flutter Developer', 'Offline-first mobile'),
  ('Warehouse IoT Dashboard (Draft)', 'role-draft-1', 0, 'Full-Stack Developer', 'Draft role placeholder')
) AS v(title, client_key, sort_order, role_name, notes) ON v.title = cr.title
WHERE cp.normalized_company_name = 'helix martin systems';

INSERT INTO company_request_skills (company_request_role_id, sort_order, skill_name)
SELECT crr.id, v.sort_order, v.skill_name
FROM company_request_roles crr
JOIN company_requests cr ON cr.id = crr.company_request_id
JOIN company_profiles cp ON cp.id = cr.company_profile_id
JOIN (VALUES
  ('Predictive Maintenance MVP', 'IoT Software Engineer', 0, 'C#'),
  ('Predictive Maintenance MVP', 'IoT Software Engineer', 1, 'Azure IoT Hub'),
  ('Predictive Maintenance MVP', 'IoT Software Engineer', 2, 'SQL Server'),
  ('Customer Analytics Platform', 'Backend Engineer', 0, 'ASP.NET Core'),
  ('Customer Analytics Platform', 'Backend Engineer', 1, 'PostgreSQL'),
  ('Customer Analytics Platform', 'Data Analyst', 0, 'Python'),
  ('Customer Analytics Platform', 'Data Analyst', 1, 'Power BI'),
  ('Customer Analytics Platform', 'Product Designer', 0, 'User Research'),
  ('Customer Analytics Platform', 'Product Designer', 1, 'Figma'),
  ('Mobile Field Service App', 'Flutter Developer', 0, 'Flutter'),
  ('Mobile Field Service App', 'Flutter Developer', 1, 'Firebase'),
  ('Warehouse IoT Dashboard (Draft)', 'Full-Stack Developer', 0, 'React')
) AS v(req_title, role_name, sort_order, skill_name)
  ON v.req_title = cr.title AND v.role_name = crr.role_name
WHERE cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Legacy talent requests (talent-search history endpoint)
-- =============================================================================
INSERT INTO company_talent_requests (
  company_profile_id, title, description, required_skills, preferred_major, engagement_type, duration, created_at
)
SELECT cp.id, v.title, v.description, v.skills, v.major, v.engagement, v.duration, v.created_at
FROM company_profiles cp
CROSS JOIN (VALUES
  ('Graduate IoT Intern Cohort', 'Short-term intern search for sensor firmware testing support.', 'Embedded C,RTOS', 'Computer Engineering', 'internship', '10 weeks', TIMESTAMPTZ '2026-04-01 10:00:00+00'),
  ('UX Research Contractor', 'Two-month contractor for field-service app discovery interviews.', 'User Research,Prototyping', 'UX Design', 'contract', '8 weeks', TIMESTAMPTZ '2026-03-15 14:00:00+00')
) AS v(title, description, skills, major, engagement, duration, created_at)
WHERE cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Individual recommendations — Predictive Maintenance MVP
-- =============================================================================
INSERT INTO company_request_recommendation_runs (
  company_request_id, company_profile_id, algorithm_version, status,
  generated_at, completed_at, error_message
)
SELECT cr.id, cp.id, 'v1-deterministic', 'completed',
  TIMESTAMPTZ '2026-05-21 09:00:00+00', TIMESTAMPTZ '2026-05-21 09:00:05+00', NULL
FROM company_requests cr
JOIN company_profiles cp ON cp.id = cr.company_profile_id
WHERE cr.title = 'Predictive Maintenance MVP'
  AND cp.normalized_company_name = 'helix martin systems';

INSERT INTO company_request_recommendations (
  run_id, company_request_id, student_profile_id, "rank", score,
  score_breakdown_json, reason_summary, highlights_json, source, created_at
)
SELECT run.id, cr.id, sp.id, v.rank, v.score, v.breakdown, v.reason, v.highlights, 'deterministic', TIMESTAMPTZ '2026-05-21 09:00:06+00'
FROM company_request_recommendation_runs run
JOIN company_requests cr ON cr.id = run.company_request_id
JOIN company_profiles cp ON cp.id = cr.company_profile_id
CROSS JOIN (VALUES
  ('omar.hassan+e2e@gmail.com',   1, 91, '{"skillOverlap":34,"roleDisciplineAlignment":20,"profileRelevance":15,"collaborationFit":12,"profileQuality":10}', 'Strong alignment with IoT backend and Azure stack.', '["Azure IoT Hub project","Maintained co-op API services"]'),
  ('aisha.kamal+e2e@gmail.com',   2, 84, '{"skillOverlap":28,"roleDisciplineAlignment":18,"profileRelevance":14,"collaborationFit":14,"profileQuality":10}', 'Mobile experience complements dashboard UX for supervisors.', '["Shipped Flutter MVP","Firebase real-time sync"]'),
  ('youssef.ali+e2e@gmail.com',   3, 76, '{"skillOverlap":24,"roleDisciplineAlignment":16,"profileRelevance":13,"collaborationFit":13,"profileQuality":10}', 'Full-stack foundation; less IoT depth but fast learner.', '["React + Node capstone","PostgreSQL reporting"]'),
  ('layla.nasser+e2e@gmail.com',  4, 68, '{"skillOverlap":20,"roleDisciplineAlignment":14,"profileRelevance":16,"collaborationFit":10,"profileQuality":8}', 'Analytics strength useful for risk-score dashboards.', '["Power BI dashboards","Python ETL scripts"]'),
  ('sara.itani+e2e@gmail.com',    5, 62, '{"skillOverlap":12,"roleDisciplineAlignment":12,"profileRelevance":18,"collaborationFit":12,"profileQuality":8}', 'UX skills valuable for alert workflows; limited IoT coding.', '["User journey mapping","Design system documentation"]')
) AS v(email, rank, score, breakdown, reason, highlights)
JOIN users u ON u.email = v.email
JOIN student_profiles sp ON sp.user_id = u.id
WHERE cr.title = 'Predictive Maintenance MVP'
  AND cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Team recommendations — Customer Analytics Platform
-- =============================================================================
INSERT INTO company_request_team_recommendation_runs (
  company_request_id, company_profile_id, algorithm_version, status,
  generated_at, completed_at, error_message
)
SELECT cr.id, cp.id, 'v1-team-deterministic-semantic', 'completed',
  TIMESTAMPTZ '2026-05-19 11:00:00+00', TIMESTAMPTZ '2026-05-19 11:00:08+00', NULL
FROM company_requests cr
JOIN company_profiles cp ON cp.id = cr.company_profile_id
WHERE cr.title = 'Customer Analytics Platform'
  AND cp.normalized_company_name = 'helix martin systems';

INSERT INTO company_request_team_recommendations (
  run_id, company_request_id, team_rank, total_score, role_coverage_score,
  compatibility_score, summary_reason, strengths_json, risks_json, created_at
)
SELECT run.id, cr.id, v.team_rank, v.total, v.coverage, v.compat, v.summary, v.strengths, v.risks, TIMESTAMPTZ '2026-05-19 11:00:09+00'
FROM company_request_team_recommendation_runs run
JOIN company_requests cr ON cr.id = run.company_request_id
JOIN company_profiles cp ON cp.id = cr.company_profile_id
CROSS JOIN (VALUES
  (1, 88, 40, 28, 'Covers all three roles with complementary analytics and API experience.', '["Full stack + data pairing","Prior group project delivery"]', '["Limited overlap on Power BI at senior level"]'),
  (2, 79, 36, 25, 'Solid coverage; designer adds research depth for executive dashboard.', '["Strong UX research","Balanced skill spread"]', '["Backend bench depth thinner than Team #1"]')
) AS v(team_rank, total, coverage, compat, summary, strengths, risks)
WHERE cr.title = 'Customer Analytics Platform'
  AND cp.normalized_company_name = 'helix martin systems';

INSERT INTO company_request_team_recommendation_members (
  team_recommendation_id, company_request_role_id, student_profile_id,
  role_score, semantic_similarity, assignment_reason, highlights_json, created_at
)
SELECT tr.id, crr.id, sp.id, v.role_score, v.sim, v.reason, v.highlights, TIMESTAMPTZ '2026-05-19 11:00:10+00'
FROM company_request_team_recommendations tr
JOIN company_requests cr ON cr.id = tr.company_request_id
JOIN company_profiles cp ON cp.id = cr.company_profile_id
JOIN company_request_roles crr ON crr.company_request_id = cr.id
JOIN (VALUES
  (1, 'Backend Engineer',  'omar.hassan+e2e@gmail.com',   92, 0.87, 'Best API/ETL fit for platform backbone.', '["ASP.NET Core","PostgreSQL"]'),
  (1, 'Data Analyst',      'layla.nasser+e2e@gmail.com',  89, 0.84, 'Strong analytics and BI delivery.', '["Python","Power BI"]'),
  (1, 'Product Designer',  'sara.itani+e2e@gmail.com',    85, 0.81, 'Executive dashboard UX and research.', '["Figma","User Research"]'),
  (2, 'Backend Engineer',  'youssef.ali+e2e@gmail.com',   80, 0.76, 'Full-stack capable for API scaffolding.', '["Node.js","PostgreSQL"]'),
  (2, 'Data Analyst',      'layla.nasser+e2e@gmail.com',  88, 0.83, 'Repeat fit for analytics workstream.', '["SQL","Statistical Analysis"]'),
  (2, 'Product Designer',  'sara.itani+e2e@gmail.com',    90, 0.85, 'Design lead for stakeholder workshops.', '["Prototyping","Design Systems"]')
) AS v(team_rank, role_name, email, role_score, sim, reason, highlights)
  ON v.role_name = crr.role_name AND v.team_rank = tr.team_rank
JOIN users u ON u.email = v.email
JOIN student_profiles sp ON sp.user_id = u.id
WHERE cr.title = 'Customer Analytics Platform'
  AND cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Saved recommendations (dashboard counts & saved lists)
-- =============================================================================
INSERT INTO company_saved_student_recommendations (
  company_profile_id, company_request_id, student_profile_id, saved_by_user_id, note, created_at
)
SELECT cp.id, cr.id, sp.id, owner.id, v.note, v.created_at
FROM company_profiles cp
JOIN company_requests cr ON cr.company_profile_id = cp.id
JOIN users owner ON owner.email = 'marcus.chen+e2e@helixmartin.com'
JOIN (VALUES
  ('Predictive Maintenance MVP', 'omar.hassan+e2e@gmail.com', 'Top pick for IoT backend — schedule technical interview.', TIMESTAMPTZ '2026-05-21 12:00:00+00'),
  ('Predictive Maintenance MVP', 'aisha.kamal+e2e@gmail.com', 'Backup for mobile alert UI stream.', TIMESTAMPTZ '2026-05-21 12:30:00+00'),
  ('Mobile Field Service App',   'aisha.kamal+e2e@gmail.com', 'Hold until project reactivated.', TIMESTAMPTZ '2026-04-01 15:00:00+00')
) AS v(req_title, email, note, created_at) ON v.req_title = cr.title
JOIN users u ON u.email = v.email
JOIN student_profiles sp ON sp.user_id = u.id
WHERE cp.normalized_company_name = 'helix martin systems';

INSERT INTO company_saved_team_recommendations (
  company_profile_id, company_request_id, team_recommendation_id, saved_by_user_id, note, created_at
)
SELECT cp.id, cr.id, tr.id, owner.id, 'Preferred team composition for analytics portal.', TIMESTAMPTZ '2026-05-19 14:00:00+00'
FROM company_profiles cp
JOIN company_requests cr ON cr.company_profile_id = cp.id AND cr.title = 'Customer Analytics Platform'
JOIN company_request_team_recommendations tr ON tr.company_request_id = cr.id AND tr.team_rank = 1
JOIN users owner ON owner.email = 'marcus.chen+e2e@helixmartin.com'
WHERE cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Activity log (dashboard recent activity)
-- =============================================================================
INSERT INTO company_activity_logs (company_profile_id, user_id, activity_type, description, created_at)
SELECT cp.id, u.id, v.activity_type, v.description, v.created_at
FROM company_profiles cp
JOIN users u ON u.email = 'marcus.chen+e2e@helixmartin.com'
CROSS JOIN (VALUES
  ('request_created',      'Created project request: Predictive Maintenance MVP', TIMESTAMPTZ '2026-03-10 10:00:00+00'),
  ('request_created',      'Created project request: Customer Analytics Platform', TIMESTAMPTZ '2026-02-15 09:30:00+00'),
  ('request_paused',       'Paused project request: Mobile Field Service App', TIMESTAMPTZ '2026-04-02 09:00:00+00'),
  ('request_closed',       'Closed project request: Legacy ERP Integration Module', TIMESTAMPTZ '2026-03-01 17:00:00+00'),
  ('student_saved',        'Saved student recommendation: Omar Hassan', TIMESTAMPTZ '2026-05-21 12:00:00+00'),
  ('team_saved',           'Saved team recommendation #1 for Customer Analytics Platform', TIMESTAMPTZ '2026-05-19 14:00:00+00'),
  ('member_added',         'Added workspace member: Priya Sharma', TIMESTAMPTZ '2026-02-03 11:05:00+00'),
  ('profile_updated',      'Updated company profile and partnership contact links', TIMESTAMPTZ '2026-05-01 08:30:00+00'),
  ('note_added',           'Internal note: Renew Azure sponsorship before June intake', TIMESTAMPTZ '2026-05-25 09:00:00+00')
) AS v(activity_type, description, created_at)
WHERE cp.normalized_company_name = 'helix martin systems';

-- =============================================================================
-- Notifications (category = company; project_id = request id or profile id)
-- =============================================================================
INSERT INTO user_notifications (user_id, category, event_type, project_id, title, body, dedup_key, created_at, read_at)
SELECT
  u.id,
  'company',
  v.event_type,
  v.project_id,
  v.title,
  v.body,
  CASE
    WHEN v.dedup_suffix IS NOT NULL THEN 'company:' || v.dedup_suffix || ':' || u.id::text
    ELSE NULL
  END,
  v.created_at,
  v.read_at
FROM users u
JOIN (VALUES
  ('marcus.chen+e2e@helixmartin.com', 'company_ai_recommendations_ready',
   (SELECT cr.id FROM company_requests cr
    JOIN company_profiles cp ON cp.id = cr.company_profile_id
    WHERE cr.title = 'Predictive Maintenance MVP' AND cp.normalized_company_name = 'helix martin systems'),
   'New AI recommendations', 'New AI recommendations are available for Predictive Maintenance MVP.',
   (SELECT 'student_run:' || run.id::text FROM company_request_recommendation_runs run
    JOIN company_requests cr ON cr.id = run.company_request_id
    WHERE cr.title = 'Predictive Maintenance MVP' LIMIT 1),
   TIMESTAMPTZ '2026-05-21 09:05:00+00', NULL::timestamptz),
  ('marcus.chen+e2e@helixmartin.com', 'company_team_recommendations_ready',
   (SELECT cr.id FROM company_requests cr
    JOIN company_profiles cp ON cp.id = cr.company_profile_id
    WHERE cr.title = 'Customer Analytics Platform' AND cp.normalized_company_name = 'helix martin systems'),
   'New AI recommendations', 'New AI recommendations are available for Customer Analytics Platform.',
   (SELECT 'team_run:' || run.id::text FROM company_request_team_recommendation_runs run
    JOIN company_requests cr ON cr.id = run.company_request_id
    WHERE cr.title = 'Customer Analytics Platform' LIMIT 1),
   TIMESTAMPTZ '2026-05-19 11:10:00+00', TIMESTAMPTZ '2026-05-20 08:00:00+00'),
  ('marcus.chen+e2e@helixmartin.com', 'company_student_recommendation_saved',
   (SELECT cr.id FROM company_requests cr
    JOIN company_profiles cp ON cp.id = cr.company_profile_id
    WHERE cr.title = 'Predictive Maintenance MVP' AND cp.normalized_company_name = 'helix martin systems'),
   'Recommendation saved', 'Marcus Chen saved Omar Hassan for Predictive Maintenance MVP.',
   NULL, TIMESTAMPTZ '2026-05-21 12:00:00+00', NULL::timestamptz),
  ('marcus.chen+e2e@helixmartin.com', 'company_team_recommendation_saved',
   (SELECT cr.id FROM company_requests cr
    JOIN company_profiles cp ON cp.id = cr.company_profile_id
    WHERE cr.title = 'Customer Analytics Platform' AND cp.normalized_company_name = 'helix martin systems'),
   'Team recommendation saved', 'Marcus Chen saved Team #1 for Customer Analytics Platform.',
   NULL, TIMESTAMPTZ '2026-05-19 14:00:00+00', NULL::timestamptz),
  ('marcus.chen+e2e@helixmartin.com', 'company_request_paused',
   (SELECT cr.id FROM company_requests cr
    JOIN company_profiles cp ON cp.id = cr.company_profile_id
    WHERE cr.title = 'Mobile Field Service App' AND cp.normalized_company_name = 'helix martin systems'),
   'Request paused', 'Mobile Field Service App request was paused.',
   NULL, TIMESTAMPTZ '2026-04-02 09:05:00+00', NULL::timestamptz),
  ('marcus.chen+e2e@helixmartin.com', 'company_request_closed',
   (SELECT cr.id FROM company_requests cr
    JOIN company_profiles cp ON cp.id = cr.company_profile_id
    WHERE cr.title = 'Legacy ERP Integration Module' AND cp.normalized_company_name = 'helix martin systems'),
   'Request closed', 'Legacy ERP Integration Module request was closed.',
   NULL, TIMESTAMPTZ '2026-03-01 17:05:00+00', TIMESTAMPTZ '2026-03-02 10:00:00+00'),
  ('marcus.chen+e2e@helixmartin.com', 'company_member_added',
   (SELECT cp.id FROM company_profiles cp WHERE cp.normalized_company_name = 'helix martin systems'),
   'Workspace member added', 'Priya Sharma was added to the workspace.',
   NULL, TIMESTAMPTZ '2026-02-03 11:10:00+00', TIMESTAMPTZ '2026-02-04 09:00:00+00'),
  ('priya.sharma+e2e@helixmartin.com', 'company_request_reactivated',
   (SELECT cr.id FROM company_requests cr
    JOIN company_profiles cp ON cp.id = cr.company_profile_id
    WHERE cr.title = 'Customer Analytics Platform' AND cp.normalized_company_name = 'helix martin systems'),
   'Request reactivated', 'Customer Analytics Platform request was reactivated.',
   NULL, TIMESTAMPTZ '2026-05-18 12:05:00+00', NULL::timestamptz)
) AS v(email, event_type, project_id, title, body, dedup_suffix, created_at, read_at)
  ON v.email = u.email;

COMMIT;

-- Quick verification
SELECT u.email, u.role, cp.company_name, cm.role AS workspace_role
FROM users u
LEFT JOIN company_profiles cp ON cp.user_id = u.id
LEFT JOIN company_members cm ON cm.user_id = u.id
WHERE u.email LIKE '%+e2e@%'
ORDER BY u.email;
