-- SkillSwap: normalize existing data to An-Najah National University only.
-- Run after deploying seed catalog changes. Safe to re-run (idempotent for most steps).

BEGIN;

-- 1) Student & doctor profiles -> An-Najah
UPDATE student_profiles
SET university = 'An-Najah National University',
    faculty = 'Faculty of Engineering and Information Technology'
WHERE university IS DISTINCT FROM 'An-Najah National University'
   OR faculty IS DISTINCT FROM 'Faculty of Engineering and Information Technology';

UPDATE doctor_profiles
SET university = 'An-Najah National University',
    faculty = 'Faculty of Engineering and Information Technology'
WHERE university IS DISTINCT FROM 'An-Najah National University'
   OR faculty IS DISTINCT FROM 'Faculty of Engineering and Information Technology';

-- 2) Student & doctor emails -> Gmail (preserve local part)
UPDATE users u
SET email = regexp_replace(lower(u.email), '@(birzeit|najah|anajah|ppu|alquds|aau|bethlehem|metrosu)\.edu$', '@gmail.com')
WHERE u.role IN ('student', 'doctor')
  AND u.email ~* '@(birzeit|najah|anajah|ppu|alquds|aau|bethlehem|metrosu)\.edu$';

-- 3) Association renames (username + email + display name)
UPDATE student_association_profiles sap
SET association_name = v.new_name,
    username = v.new_username,
    email = v.new_username || '@orgs.skillswap.ps',
    faculty = 'Faculty of Engineering and Information Technology',
    description = v.new_description
FROM (VALUES
  ('ieee-birzeit', 'IEEE An-Najah Student Branch', 'ieee-anajah', 'IEEE An-Najah organizes technical workshops, hardware labs, and industry talks for engineering students.'),
  ('gdsc-najah', 'Google Developer Student Club An-Najah', 'gdsc-anajah', 'GDSC An-Najah hosts study jams, Android clinics, and cloud certification prep sessions.'),
  ('cyber-ppu', 'Cyber Security Club — An-Najah', 'cyber-anajah', 'Cyber Security Club at An-Najah runs CTF practice, ethical hacking workshops, and campus awareness campaigns.'),
  ('robotics-alquds', 'Robotics Club — An-Najah', 'robotics-anajah', 'Robotics Club at An-Najah builds autonomous platforms, drone prototypes, and competes in regional contests.'),
  ('ai-aau', 'AI Club — An-Najah', 'ai-anajah', 'AI Club at An-Najah explores machine learning projects, model deployment workshops, and research reading groups.'),
  ('entrepreneurship-bethlehem', 'Entrepreneurship Club — An-Najah', 'entrepreneurship-anajah', 'Entrepreneurship Club at An-Najah mentors founders, hosts pitch nights, and connects students with local incubators.'),
  ('wit-birzeit', 'Women in Tech — An-Najah', 'wit-anajah', 'Women in Tech at An-Najah supports mentorship circles, interview prep, and inclusive hackathon teams.'),
  ('oss-najah', 'Open Source Collective — An-Najah', 'oss-anajah', 'Open Source Collective at An-Najah contributes to Arabic localization, documentation sprints, and GitHub workshops.'),
  ('media-ppu', 'Media & Design Society — An-Najah', 'media-anajah', 'Media Society at An-Najah produces campus documentaries, motion graphics tutorials, and live event coverage.'),
  ('volunteer-alquds', 'Volunteer Tech Corps — An-Najah', 'volunteer-anajah', 'Volunteer Tech Corps at An-Najah refurbishes laptops and teaches digital literacy in Nablus communities.'),
  ('data-aau', 'Data Science Society — An-Najah', 'data-anajah', 'Data Science Society at An-Najah hosts Kaggle study groups, visualization challenges, and analytics career panels.'),
  ('acm-birzeit', 'ACM An-Najah Student Chapter', 'acm-anajah', 'ACM An-Najah hosts competitive programming training, industry seminars, and coding interview workshops.'),
  ('lug-najah', 'Linux User Group — An-Najah', 'lug-anajah', 'Linux User Group at An-Najah promotes open-source adoption, server administration workshops, and campus infrastructure projects.'),
  ('design-ppu', 'Design Thinking Society — An-Najah', 'design-anajah', 'Design Thinking Society at An-Najah runs ideation sprints, prototyping nights, and social innovation challenges.'),
  ('gamedev-alquds', 'Programming Club — An-Najah', 'programming-anajah', 'Programming Club at An-Najah collaborates on algorithms practice, competitive programming, and portfolio reviews.'),
  ('fintech-aau', 'FinTech Student Network — An-Najah', 'fintech-anajah', 'FinTech Network at An-Najah connects students with payment startups, hackathons, and compliance workshops.'),
  ('wie-bethlehem', 'IEEE Women in Engineering — An-Najah', 'wie-anajah', 'IEEE WIE An-Najah mentors women engineers through technical talks, shadowing, and leadership programs.'),
  ('makers-ppu', 'Palestine Makerspace Alliance — An-Najah', 'makers-anajah', 'Makerspace Alliance at An-Najah operates electronics benches, 3D printers, and hardware mentorship hours.'),
  ('consult-birzeit', 'Student Consultancy Group — An-Najah', 'consult-anajah', 'Student Consultancy at An-Najah delivers pro-bono digital strategy projects for local NGOs.'),
  ('cloudnative-najah', 'Cloud Native Club — An-Najah', 'cloudnative-anajah', 'Cloud Native Club at An-Najah studies Kubernetes, observability stacks, and platform engineering career paths.')
) AS v(old_username, new_name, new_username, new_description)
WHERE sap.username = v.old_username;

UPDATE users u
SET email = sap.email,
    name = sap.association_name
FROM student_association_profiles sap
WHERE sap.user_id = u.id
  AND u.role = 'studentassociation'
  AND (u.email IS DISTINCT FROM sap.email OR u.name IS DISTINCT FROM sap.association_name);

COMMIT;
