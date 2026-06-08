-- Data-only fix: Computer Engineering graduation projects must have exactly 2 members.
-- Prefer running SkillSwapCeTeamFixRunner for redistribution logic.
-- This script reports current CE team sizes.

SELECT gp.id,
       gp.name,
       sp.major,
       COUNT(gpm.id) AS member_count
FROM graduation_projects gp
JOIN student_profiles sp ON sp.id = gp.owner_id
LEFT JOIN graduation_project_members gpm ON gpm.project_id = gp.id
WHERE sp.major = 'Computer Engineering'
GROUP BY gp.id, gp.name, sp.major
ORDER BY member_count, gp.id;
