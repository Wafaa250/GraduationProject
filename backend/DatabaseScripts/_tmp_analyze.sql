SELECT MAX(cnt) AS max_courses, ROUND(AVG(cnt)::numeric,2) AS avg_courses
FROM (SELECT "StudentProfileId", COUNT(*) cnt FROM section_enrollments GROUP BY "StudentProfileId") x;

SELECT sp.id, sp.academic_year, sp.major, COUNT(se."Id") AS courses
FROM student_profiles sp
LEFT JOIN section_enrollments se ON se."StudentProfileId" = sp.id
GROUP BY sp.id, sp.academic_year, sp.major
ORDER BY courses DESC LIMIT 10;

SELECT sp.academic_year, COUNT(*) AS gp_owners
FROM graduation_projects gp
JOIN student_profiles sp ON sp.id = gp.owner_id
GROUP BY sp.academic_year ORDER BY 1;

SELECT COUNT(*) AS invalid_gp
FROM graduation_projects gp
JOIN student_profiles sp ON sp.id = gp.owner_id
WHERE sp.academic_year NOT IN ('Fourth Year', 'Fifth Year');

SELECT cs."Id", c."Code", c."Name", cs."Name" AS section_name
FROM course_sections cs JOIN courses c ON c."Id" = cs."CourseId" ORDER BY cs."Id";
