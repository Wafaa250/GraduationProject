-- =============================================================================
-- SkillSwap — realistic recommendation test students (PostgreSQL)
-- Generated from live schema inspection of skillswap_db (May 2026)
--
-- Tables used by Individual + AI-Built Team recommendations:
--   users (role = 'student')
--   student_profiles (roles, technical_skills, tools = JSON arrays of skill IDs)
--   skills (name UNIQUE, category in: role | technical | tool)
--   student_skills (optional join table — engine primarily uses JSON columns)
--
-- BEFORE RUNNING:
--   1) Backup your DB.
--   2) Run in a transaction; ROLLBACK first if you only want a dry run.
--   3) All new logins use password: Password123!
--   4) BCrypt hash below matches Password123!
--
-- NOTE: company_request_team_* tables were NOT present in the DB at inspection time.
--       Run: dotnet ef database update  (if team recommendations fail)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Reference: current DB state at generation time
--    users: 50 max id | student_profiles: 21 max id | skills: 25 | student_skills: 0 rows
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1) Skills required for balanced recommendation / team testing
--    (ON CONFLICT on unique name — safe to re-run)
-- ---------------------------------------------------------------------------
INSERT INTO skills (name, category) VALUES
  ('UI/UX Designer', 'role'),
  ('Mobile Developer', 'role'),
  ('ML Engineer', 'role'),
  ('Software Engineer', 'role'),
  ('Data Analyst', 'role'),
  ('UI/UX Design', 'technical'),
  ('Python', 'technical'),
  ('Machine Learning', 'technical'),
  ('TypeScript', 'technical'),
  ('PostgreSQL', 'technical'),
  ('TensorFlow', 'technical'),
  ('Financial Analysis', 'technical'),
  ('Accounting', 'technical'),
  ('Business Analysis', 'technical'),
  ('Figma', 'tool'),
  ('Next.js', 'tool'),
  ('Node.js', 'tool'),
  ('Flutter', 'tool'),
  ('React Native', 'tool'),
  ('Excel', 'tool'),
  ('Power BI', 'tool')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) New student users (IDs 51–62 reserved — adjust if you already use them)
--    Password: Password123!
-- ---------------------------------------------------------------------------
INSERT INTO users (id, name, email, password, role, created_at) VALUES
  (51, 'Layla Khoury',      'layla.khoury@skillswap.test',      '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (52, 'Omar Nassar',       'omar.nassar@skillswap.test',       '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (53, 'Maya Haddad',       'maya.haddad@skillswap.test',       '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (54, 'Karim Saleh',       'karim.saleh@skillswap.test',       '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (55, 'Nour Azem',         'nour.azem@skillswap.test',         '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (56, 'Rania Issa',        'rania.issa@skillswap.test',        '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (57, 'Tareq Hamdan',      'tareq.hamdan@skillswap.test',      '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (58, 'Yasmine Farouki',   'yasmine.farouki@skillswap.test',   '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (59, 'Elias Mousa',       'elias.mousa@skillswap.test',       '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (60, 'Dana Shami',        'dana.shami@skillswap.test',        '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (61, 'Zeinab Awad',       'zeinab.awad@skillswap.test',       '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW()),
  (62, 'Adam Rizk',         'adam.rizk@skillswap.test',         '$2b$11$GfTdrinaUiwOhDzq8u.eteYf4wHnekpeZdf4P6K3WNAMdhX/53ZMW', 'student', NOW())
ON CONFLICT (id) DO NOTHING;

-- Reset sequences so future signups do not collide (only if you used explicit IDs above)
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users));

-- ---------------------------------------------------------------------------
-- 3) Student profiles (IDs 22–33)
--    JSON columns store arrays of skill IDs, e.g. [16,25]
--    languages stores plain string JSON, e.g. ["English","Arabic"]
-- ---------------------------------------------------------------------------
INSERT INTO student_profiles (
  id, user_id, student_id, university, faculty, major, academic_year, gpa,
  bio, availability, looking_for, github, linkedin, portfolio,
  languages, roles, technical_skills, tools
) VALUES
(
  22, 51, '202110451', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Computer Science', 'Fourth Year', 3.72,
  'Frontend-focused CS student with strong React/TypeScript experience building responsive dashboards and component libraries for university projects.',
  'Available', 'Frontend developer internships and product engineering teams',
  'https://github.com/layla-khoury-demo', 'https://linkedin.com/in/layla-khoury-demo', 'https://layla-portfolio-demo.dev',
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Frontend Developer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('React','Web Development','TypeScript')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('JavaScript','React','Next.js'))
),
(
  23, 52, '202010332', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Computer Engineering', 'Fourth Year', 3.68,
  'Backend engineer specializing in ASP.NET Core APIs, PostgreSQL, and clean architecture for SaaS-style graduation projects.',
  'Available', 'Backend/API roles on cross-functional product teams',
  'https://github.com/omar-nassar-demo', 'https://linkedin.com/in/omar-nassar-demo', NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Backend Developer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Web Development','PostgreSQL')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('ASP.NET','C#','PostgreSQL'))
),
(
  24, 53, '202210887', 'An-Najah National University', 'Faculty of Fine Arts',
  'Graphic Design', 'Third Year', 3.55,
  'UI/UX designer focused on user research, wireframing, and high-fidelity prototypes for web and mobile products.',
  'Limited', 'UI/UX design roles in startup and product teams',
  NULL, 'https://linkedin.com/in/maya-haddad-demo', 'https://behance.net/maya-haddad-demo',
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('UI/UX Designer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('UI/UX Design')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Figma'))
),
(
  25, 54, '202110904', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Information Technology', 'Third Year', 3.61,
  'Mobile developer building cross-platform Flutter apps with REST API integration and clean state management.',
  'Available', 'Mobile app teams and Flutter-based product squads',
  'https://github.com/karim-saleh-demo', NULL, NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Mobile Developer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Web Development')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Flutter','Dart','React Native'))
),
(
  26, 55, '202010771', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Computer Science', 'Fourth Year', 3.80,
  'ML engineer with project experience in classification pipelines, model evaluation, and deploying inference APIs.',
  'Available', 'AI/ML engineering roles and data-heavy product teams',
  'https://github.com/nour-azem-demo', 'https://linkedin.com/in/nour-azem-demo', NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('ML Engineer','Data Scientist')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Python','Machine Learning','TensorFlow')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Python','TensorFlow'))
),
(
  27, 56, '202110623', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Computer Science', 'Fourth Year', 3.66,
  'Full-stack student comfortable owning React frontends and ASP.NET backends for end-to-end graduation platforms.',
  'Available', 'Full-stack collaboration on company graduation projects',
  'https://github.com/rania-issa-demo', NULL, NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Frontend Developer','Backend Developer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('React','Web Development')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('React','ASP.NET','JavaScript','C#'))
),
(
  28, 57, '202010198', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Computer Engineering', 'Third Year', 3.58,
  'Backend-oriented engineer with cloud deployment exposure and API performance tuning for team-based software projects.',
  'Limited', 'Backend/platform roles with strong engineering standards',
  'https://github.com/tareq-hamdan-demo', NULL, NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Backend Developer','Software Engineer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Cloud Systems','Network Security','PostgreSQL')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('ASP.NET','Node.js','PostgreSQL'))
),
(
  29, 58, '202210044', 'An-Najah National University', 'Faculty of Economics and Social Sciences',
  'Accounting', 'Third Year', 3.49,
  'Accounting student with financial modeling, reporting, and Excel/Power BI skills for business analytics collaborations.',
  'Available', 'Finance and business operations project teams',
  NULL, 'https://linkedin.com/in/yasmine-farouki-demo', NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Data Analyst')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Financial Analysis','Accounting','Business Analysis')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Excel','Power BI'))
),
(
  30, 59, '202110512', 'An-Najah National University', 'Faculty of Engineering',
  'Mechanical Engineering', 'Fourth Year', 3.42,
  'Mechanical engineering student focused on CAD modeling, product design documentation, and interdisciplinary hardware-software projects.',
  'Limited', 'Engineering design teams with CAD deliverables',
  NULL, NULL, NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Mechanical Engineer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Mechanical Design')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('AutoCAD','SolidWorks','MATLAB'))
),
(
  31, 60, '202210331', 'An-Najah National University', 'Faculty of Medicine and Health Sciences',
  'Doctor of Pharmacy (PharmD)', 'Fourth Year', 3.71,
  'Pharmacy student with clinical assessment and healthcare systems knowledge; strong fit for health-tech collaboration contexts.',
  'Busy', 'Healthcare and clinical workflow projects',
  NULL, NULL, NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Clinical Specialist')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Patient Care','Clinical Assessment')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Hospital Information Systems'))
),
(
  32, 61, '202110902', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Computer Science', 'Third Year', 3.64,
  'Data analyst with SQL, dashboarding, and product analytics focus for business and engineering teams.',
  'Available', 'Data analyst roles on product and operations teams',
  'https://github.com/zeinab-awad-demo', NULL, NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Data Analyst','Data Scientist')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Python','Machine Learning')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Excel','Power BI','PostgreSQL'))
),
(
  33, 62, '202010445', 'An-Najah National University', 'Faculty of Engineering and Information Technology',
  'Computer Engineering', 'Fourth Year', 3.60,
  'Versatile software engineer with balanced frontend and backend delivery experience for AI-built team compositions.',
  'Available', 'Cross-functional software teams and startup collaborations',
  'https://github.com/adam-rizk-demo', 'https://linkedin.com/in/adam-rizk-demo', NULL,
  '["English","Arabic"]',
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Software Engineer','Frontend Developer')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('Web Development','React')),
  (SELECT json_agg(id)::text FROM skills WHERE name IN ('JavaScript','React','C#','ASP.NET'))
)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('student_profiles', 'id'), (SELECT COALESCE(MAX(id), 1) FROM student_profiles));

-- ---------------------------------------------------------------------------
-- 4) Optional: mirror key skills in student_skills (join table)
--    Recommendation engine reads JSON columns first; this keeps data consistent
--    with registration flows that may use either representation later.
-- ---------------------------------------------------------------------------
INSERT INTO student_skills (student_id, skill_id, level)
SELECT sp.id, sk.id, 4
FROM student_profiles sp
CROSS JOIN LATERAL (
  SELECT (json_array_elements_text(COALESCE(sp.roles, '[]')::json))::int AS skill_id
  UNION
  SELECT (json_array_elements_text(COALESCE(sp.technical_skills, '[]')::json))::int
  UNION
  SELECT (json_array_elements_text(COALESCE(sp.tools, '[]')::json))::int
) ids
JOIN skills sk ON sk.id = ids.skill_id
WHERE sp.id BETWEEN 22 AND 33
ON CONFLICT (student_id, skill_id) DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- 5) Verification queries (run after COMMIT)
-- ---------------------------------------------------------------------------
-- SELECT sp.id, u.name, sp.major, sp.roles, sp.technical_skills, sp.tools
-- FROM student_profiles sp JOIN users u ON u.id = sp.user_id
-- WHERE sp.id BETWEEN 22 AND 33 ORDER BY sp.id;
--
-- SELECT COUNT(*) FROM student_skills WHERE student_id BETWEEN 22 AND 33;
