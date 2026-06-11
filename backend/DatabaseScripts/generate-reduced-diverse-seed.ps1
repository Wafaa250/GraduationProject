# Generates skillswap-diverse-seed.sql with contiguous IDs and coherent FK chains
$ErrorActionPreference = 'Stop'
$outPath = Join-Path $PSScriptRoot 'skillswap-diverse-seed.sql'
$ts = '2026-06-11 12:00:00+03'
$pwdStudent = '$2a$11$zNKLeu7rDBuWEuc.f2Rv3.q.qs42vcw/2jh60.MrYsshXfI4uEJNe'
$pwdAdmin = '$2a$11$vYHr3KGO8b1KY7175tUem.vOq1y8LY5finldnijnsBORLNocu0DRq'

function Q([string]$s) { if ($null -eq $s) { 'NULL' } else { "'" + $s.Replace("'", "''") + "'" } }
function QJson([string]$s) { Q($s) }
function L([string[]]$lines) { $script:buf += ($lines -join "`n") }

$buf = @()
L @'
-- =============================================================================
-- SkillSwap Diverse University Seed Data (Reduced, Regenerated)
-- Generated: 2026-06-11
-- Database: skillswap_db @ PostgreSQL
-- Default password for all accounts: SkillSwap2026!
-- Admin marker: platform.diverse.seed@skillswap.ps
-- =============================================================================

BEGIN;

TRUNCATE TABLE
  company_activity_logs, company_follows, company_member_notification_preferences, company_members, company_profiles,
  company_request_recommendation_runs, company_request_recommendations, company_request_roles, company_request_skills,
  company_request_team_recommendation_members, company_request_team_recommendation_runs, company_request_team_recommendations,
  company_requests, company_saved_student_recommendations, company_saved_team_recommendations, company_talent_requests,
  conversation_users, conversations, course_project_sections, course_projects, course_sections, course_team_invitations,
  course_team_members, course_team_messages, course_teams, courses, doctor_posts, doctor_profiles, feed_post_comments,
  feed_post_engagements, graduation_project_members, graduation_project_milestones, graduation_projects, messages,
  organization_follows, password_reset_codes, password_reset_tokens, project_invitations, recommendation_semantic_embeddings,
  section_chat_messages, section_enrollments, skills, student_association_profiles,
  student_organization_event_registration_answers, student_organization_event_registration_fields,
  student_organization_event_registration_forms, student_organization_event_registrations, student_organization_events,
  student_organization_members, student_organization_recruitment_applicant_analyses,
  student_organization_recruitment_application_answers, student_organization_recruitment_applications,
  student_organization_recruitment_campaigns, student_organization_recruitment_positions,
  student_organization_recruitment_questions, student_organization_team_members, student_posts, student_profiles,
  student_skills, supervisor_cancellation_requests, supervisor_requests, user_notifications, users
RESTART IDENTITY CASCADE;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

'@

# --- Student catalog (45 students, contiguous profile ids 1..45) ---
$engFac = 'Faculty of Engineering and Information Technology'
$bizFac = 'Faculty of Business and Economics'
$medFac = 'Faculty of Medicine and Health Sciences'
$archFac = 'Faculty of Engineering and Architecture'

# 45 unique Palestinian student full names (no first+last pair repeated)
$uniqueStudentNames = @(
  'Mohammad Hammad', 'Khaled Hijazi', 'Nour Mitri', 'Maya Anton', 'Yasmin Nasser',
  'Hanan Asfour', 'Tala Sabbah', 'Kareem Salem', 'Husam Yasin', 'Sami Masri',
  'Omar Awad', 'Layla Khoury', 'Fadi Qasrawi', 'Waleed Farah', 'Ibrahim Mansour',
  'Aya Canawati', 'Rawan Tamimi', 'Bilal Odeh', 'Majd Zayed', 'Yara Hanania',
  'Reem Haddad', 'Suhad Darwish', 'Jana Sbeih', 'Murad Qasem', 'Bashar Rishmawi',
  'Ahmad Barakat', 'Ziad Khalil', 'Lina Tamimi', 'Hiba Zaru', 'Tamer Qasrawi',
  'Dalia Hosh', 'Rami Saleh', 'Nadia Hijazi', 'Samer Awad', 'Hala Khoury',
  'Yazan Hamad', 'Mariam Canawati', 'Anas Sabbagh', 'Rula Abu Ghosh', 'Bilal Salem',
  'Suhad Najjar', 'Tala Odeh', 'George Saca', 'Amal Shalabi', 'Karim Nassar'
)

$studentDefs = [System.Collections.Generic.List[object]]::new()
$si = 0
$nameIdx = 0
function Add-Students($major, $faculty, $isEng, [string[]]$years) {
  foreach ($y in $years) {
    $script:si++
    $fullName = $script:uniqueStudentNames[$script:nameIdx++]
    $emailLocal = ($fullName.ToLower() -replace ' ', '.' -replace '[^a-z0-9.]','') + $script:si
    $script:studentDefs.Add([pscustomobject]@{
      Id = $script:si; UserId = $script:si + 1; Name = $fullName
      Email = "$emailLocal@gmail.com"
      Major = $major; Faculty = $faculty; Year = $y; IsEng = $isEng
    })
  }
}

Add-Students 'Software Engineering' $engFac $true @('First Year','Second Year','Third Year','Fourth Year','Fifth Year')
Add-Students 'Computer Engineering' $engFac $true @('First Year','Second Year','Fourth Year')
Add-Students 'Computer Science' $engFac $true @('Second Year','Third Year','Fourth Year','Fifth Year')
Add-Students 'Information Technology' $engFac $true @('First Year','Third Year','Fifth Year')
Add-Students 'Artificial Intelligence' $engFac $true @('Second Year','Fourth Year','Fifth Year')
Add-Students 'Data Science' $engFac $true @('First Year','Third Year','Fifth Year')
Add-Students 'Cybersecurity' $engFac $true @('Second Year','Fourth Year')
Add-Students 'Electrical Engineering' $engFac $true @('Third Year','Fifth Year')
Add-Students 'Industrial Engineering' $engFac $true @('Second Year','Fourth Year')
Add-Students 'Mechanical Engineering' $engFac $true @('First Year','Fifth Year')
Add-Students 'Business Administration' $bizFac $false @('Second Year','Fourth Year')
Add-Students 'Accounting' $bizFac $false @('First Year','Third Year','Fifth Year')
Add-Students 'Marketing' $bizFac $false @('Second Year','Fourth Year')
Add-Students 'Medicine' $medFac $false @('Third Year','Fifth Year')
Add-Students 'Nursing' $medFac $false @('First Year','Fourth Year')
Add-Students 'Pharmacy' $medFac $false @('Second Year','Fifth Year')
Add-Students 'Architecture' $archFac $false @('Third Year','Fourth Year')

# Trim to exactly 45 if over
while ($studentDefs.Count -gt 45) { $studentDefs.RemoveAt($studentDefs.Count - 1) }
while ($studentDefs.Count -lt 45) {
  Add-Students 'Software Engineering' $engFac $true @('Third Year')
}

# --- USERS ---
L '-- users'
L "INSERT INTO public.users (id, name, email, password, role, created_at, must_change_password) VALUES (1, 'SkillSwap Diverse Seed', 'platform.diverse.seed@skillswap.ps', $(Q $pwdAdmin), 'admin', $(Q $ts), false);"
foreach ($s in $studentDefs) {
  L "INSERT INTO public.users (id, name, email, password, role, created_at, must_change_password) VALUES ($($s.UserId), $(Q $s.Name), $(Q $s.Email), $(Q $pwdStudent), 'student', $(Q $ts), false);"
}

$doctorDefs = @(
  @{Id=1;Name='Dr. Sami Barakat';Spec='Artificial Intelligence';Dept='Computer Science'},
  @{Id=2;Name='Dr. Rania Khalil';Spec='Software Engineering';Dept='Software Engineering'},
  @{Id=3;Name='Dr. Omar Masri';Spec='Cybersecurity';Dept='Computer Engineering'},
  @{Id=4;Name='Dr. Layla Tamimi';Spec='Cloud Computing';Dept='Information Technology'},
  @{Id=5;Name='Dr. Hassan Qasem';Spec='Data Science';Dept='Computer Science'},
  @{Id=6;Name='Dr. Nour Sabbah';Spec='Machine Learning';Dept='Artificial Intelligence'},
  @{Id=7;Name='Dr. Fadi Hijazi';Spec='Electrical Engineering';Dept='Electrical Engineering'},
  @{Id=8;Name='Dr. Mahmoud Darwish';Spec='Industrial Engineering';Dept='Industrial Engineering'},
  @{Id=9;Name='Dr. Hala Mansour';Spec='Business Informatics';Dept='Business Administration'},
  @{Id=10;Name='Dr. Tariq Nasser';Spec='Architecture';Dept='Architecture'},
  @{Id=11;Name='Dr. Amal Khoury';Spec='Clinical Informatics';Dept='Medicine'},
  @{Id=12;Name='Dr. George Mitri';Spec='Pharmacy Systems';Dept='Pharmacy'}
)
foreach ($d in $doctorDefs) {
  $uid = 46 + $d.Id
  $email = ($d.Name -replace 'Dr\. ','dr.' -replace ' ','-').ToLower() + '@gmail.com'
  L "INSERT INTO public.users (id, name, email, password, role, created_at, must_change_password) VALUES ($uid, $(Q $d.Name), $(Q $email), $(Q $pwdStudent), 'doctor', $(Q $ts), false);"
}

$companies = @(
  @{Id=1;Name='ASAL Technologies';Email='careers@asaltech.com';Industry='Software Engineering & Outsourcing';Contact='Nadine Khoury';Member='Ziad Qasrawi'},
  @{Id=2;Name='Nablus AI Labs';Email='talent@nablusai.ps';Industry='Artificial Intelligence Startup';Contact='Waleed Sbeih';Member='Murad Hijazi'},
  @{Id=3;Name='PayBridge Palestine';Email='jobs@paybridge.ps';Industry='Financial Technology';Contact='Jana Hosh';Member='Hala Odeh'},
  @{Id=4;Name='MediConnect Health Tech';Email='careers@mediconnect.ps';Industry='Healthcare Technology';Contact='Lina Sabbah';Member='Reem Mitri'},
  @{Id=5;Name='EduSpark Palestine';Email='hello@eduspark.ps';Industry='Education Technology';Contact='Tariq Tamimi';Member='Khaled Barakat'},
  @{Id=6;Name='Palestine Telecom Software';Email='people@ptsw.ps';Industry='Telecommunications';Contact='Omar Farah';Member='Nour Awad'}
)
foreach ($c in $companies) {
  $cuid = 58 + 2 * $c.Id - 1
  $muid = 58 + 2 * $c.Id
  L "INSERT INTO public.users (id, name, email, password, role, created_at, must_change_password) VALUES ($cuid, $(Q $c.Contact), $(Q $c.Email), $(Q $pwdStudent), 'company', $(Q $ts), false);"
  $memberEmail = ($c.Member.ToLower() -replace ' ', '.') + '@' + (($c.Email -split '@')[1])
  L "INSERT INTO public.users (id, name, email, password, role, created_at, must_change_password) VALUES ($muid, $(Q $c.Member), $(Q $memberEmail), $(Q $pwdStudent), 'companymember', $(Q $ts), false);"
}

$assocs = @(
  @{Id=1;Name='IEEE An-Najah Student Branch';User='ieee-anajah'},
  @{Id=2;Name='ACM An-Najah Student Chapter';User='acm-anajah'},
  @{Id=3;Name='Google Developer Student Club An-Najah';User='gdsc-anajah'},
  @{Id=4;Name='Cyber Security Club - An-Najah';User='cyber-anajah'},
  @{Id=5;Name='Robotics Club - An-Najah';User='robotics-anajah'}
)
foreach ($a in $assocs) {
  $uid = 70 + $a.Id
  L "INSERT INTO public.users (id, name, email, password, role, created_at, must_change_password) VALUES ($uid, $(Q $a.Name), $(Q ($a.User + '@orgs.skillswap.ps')), $(Q $pwdStudent), 'studentassociation', $(Q $ts), false);"
}

# --- COMPANY PROFILES & MEMBERS ---
L '-- company_profiles'
foreach ($c in $companies) {
  $cuid = 58 + 2 * $c.Id - 1
  $norm = $c.Name.ToLower()
  $dom = ($c.Email -split '@')[1]
  L "INSERT INTO public.company_profiles (id, user_id, company_name, industry, description, linkedin_url, location, website_url, areas_of_interest, contact_email, headquarters_location, optional_contact_link, working_style, normalized_company_name, primary_email_domain, website_domain) VALUES ($($c.Id), $cuid, $(Q $c.Name), $(Q $c.Industry), $(Q ($c.Name + ' builds innovative solutions in ' + $c.Industry + '.')), NULL, 'Nablus, Palestine', $(Q ('https://www.' + $dom)), '[""React"",""PostgreSQL""]', $(Q $c.Email), 'Nablus, Palestine', NULL, 'Hybrid', $(Q $norm), $(Q $dom), $(Q $dom));"
  $muid = 58 + 2 * $c.Id
  L "INSERT INTO public.company_members (id, company_profile_id, user_id, role, created_at) VALUES ($($c.Id), $($c.Id), $muid, 'recruiter', $(Q $ts));"
}

# --- DOCTOR PROFILES ---
L '-- doctor_profiles'
foreach ($d in $doctorDefs) {
  $uid = 46 + $d.Id
  L "INSERT INTO public.doctor_profiles (id, user_id, specialization, supervision_capacity, bio, university, faculty, profile_picture_base64, department, linkedin, office_hours, research_skills, technical_skills, years_of_experience, academic_rank, available_for_supervision, notification_preferences, phone_number, preferred_project_areas, research_interests) VALUES ($($d.Id), $uid, $(Q $d.Spec), 5, $(Q ($d.Name + ' supervises capstone projects in ' + $d.Dept + '.')), 'An-Najah National University', 'Faculty of Engineering and Information Technology', NULL, $(Q $d.Dept), NULL, 'Thu 09-11', '[""Research""]', '[""Python""]', 10, NULL, true, NULL, NULL, NULL, NULL);"
}

# --- STUDENT PROFILES ---
L '-- student_profiles'
foreach ($s in $studentDefs) {
  $gpa = [math]::Round(2.5 + ($s.Id % 15) * 0.08, 2)
  $sid = "2024$($s.Id.ToString('0000'))"
  $bio = "$($s.Major) student focused on $($s.Year) coursework and collaborative projects."
  L "INSERT INTO public.student_profiles (id, user_id, major, bio, student_id, university, faculty, academic_year, gpa, availability, looking_for, github, linkedin, portfolio, profile_picture_base64, languages, tools, roles, technical_skills, notification_preferences, ai_project_interests, collaboration_preferences, expected_graduation, other_links, personal_website) VALUES ($($s.Id), $($s.UserId), $(Q $s.Major), $(Q $bio), $(Q $sid), 'An-Najah National University', $(Q $s.Faculty), $(Q $s.Year), $gpa, 'Available 10-15 hrs/week', 'Teammates and internships', NULL, NULL, NULL, NULL, '[""Arabic"",""English""]', '[1,2]', '[""Developer""]', '[1,2]', NULL, NULL, NULL, NULL, NULL, NULL);"
}

# --- ASSOCIATION PROFILES ---
L '-- student_association_profiles'
foreach ($a in $assocs) {
  $uid = 70 + $a.Id
  L "INSERT INTO public.student_association_profiles (id, user_id, association_name, username, email, description, faculty, category, logo_url, instagram_url, facebook_url, linkedin_url, is_verified, created_at) VALUES ($($a.Id), $uid, $(Q $a.Name), $(Q $a.User), $(Q ($a.User + '@orgs.skillswap.ps')), $(Q ($a.Name + ' student organization at An-Najah.')), 'Faculty of Engineering and Information Technology', 'Technical', NULL, NULL, NULL, NULL, true, $(Q $ts));"
}

# --- SKILLS (50) ---
$skillNames = @('React','TypeScript','Python','PostgreSQL','Docker','Machine Learning','Node.js','ASP.NET Core','TensorFlow','Cybersecurity','IoT','Azure','Kubernetes','SQL','UX Design','Flutter','Java','C#','Penetration Testing','NLP','Power BI','Embedded Systems','MQTT','Figma','Angular','Vue.js','MongoDB','Redis','Git','Linux','Wireshark','Cryptography','Pandas','Scikit-learn','Arduino','RTOS','AWS','CI/CD','Terraform','Accessibility','Statistical Analysis','Go','Rust','Swift','Kotlin','React Native','Deep Learning','Network Security','Prototyping','User Research')
L '-- skills'
for ($i = 1; $i -le $skillNames.Count; $i++) {
  $cat = if ($i % 5 -eq 0) { 'tool' } else { 'technical' }
  L "INSERT INTO public.skills (id, name, category) VALUES ($i, $(Q $skillNames[$i-1]), '$cat');"
}

# --- STUDENT SKILLS ---
L '-- student_skills'
$ssId = 0
foreach ($s in $studentDefs) {
  $sk1 = (($s.Id * 3) % 50) + 1
  $sk2 = (($s.Id * 7) % 50) + 1
  foreach ($sk in @($sk1, $sk2) | Select-Object -Unique) {
    $ssId++
    L "INSERT INTO public.student_skills (id, student_id, skill_id, level) VALUES ($ssId, $($s.Id), $sk, $(1 + $s.Id % 3));"
  }
}

# --- COURSES (10) & SECTIONS (20) ---
$courseDefs = @(
  @{Id=1;Code='SE401';Name='Advanced Software Architecture';Doc=1},
  @{Id=2;Code='CS350';Name='Machine Learning Fundamentals';Doc=2},
  @{Id=3;Code='CE320';Name='Embedded Systems Design';Doc=3},
  @{Id=4;Code='IT310';Name='Cloud Infrastructure';Doc=4},
  @{Id=5;Code='CY301';Name='Ethical Hacking Lab';Doc=5},
  @{Id=6;Code='DS340';Name='Data Mining & Visualization';Doc=6},
  @{Id=7;Code='EE305';Name='Power Electronics';Doc=7},
  @{Id=8;Code='IE330';Name='Operations Research';Doc=8},
  @{Id=9;Code='BA360';Name='Digital Business Strategy';Doc=9},
  @{Id=10;Code='AR315';Name='BIM for Architectural Design';Doc=10}
)
L '-- courses'
foreach ($co in $courseDefs) {
  L "INSERT INTO public.courses (""Id"", ""Name"", ""Code"", ""Semester"", ""CreatedAt"", ""DoctorId"", ""AcademicYear"", ""AllowAiTeamSuggestions"", ""AllowCourseProjects"", ""AllowStudentCollaboration"", ""AllowTeamFormation"", ""DefaultTeamFormationStrategy"", ""Description"") VALUES ($($co.Id), $(Q $co.Name), $(Q $co.Code), 'Fall 2025', $(Q $ts), $($co.Doc), NULL, true, true, true, true, 'doctor', NULL);"
}
$secId = 0
L '-- course_sections'
foreach ($co in $courseDefs) {
  foreach ($sec in @('A','B')) {
    $secId++
    $secName = "Section $sec"
    L "INSERT INTO public.course_sections (""Id"", ""CourseId"", ""Name"", ""Days"", ""TimeFrom"", ""TimeTo"", ""Capacity"", ""CreatedAt"") VALUES ($secId, $($co.Id), '$secName', '[""Sunday"",""Tuesday""]', '09:00', '10:30', 40, $(Q $ts));"
  }
}

# --- ENROLLMENTS (max 3-4 per student) ---
L '-- section_enrollments'
$enrId = 0
foreach ($s in $studentDefs) {
  $maxCourses = switch -Regex ($s.Year) { 'First|Second' { 4 } 'Third' { 4 } default { 3 } }
  for ($c = 0; $c -lt $maxCourses; $c++) {
    $enrId++
    $courseNum = (($s.Id + $c - 1) % 10) + 1
    $sectionId = ($courseNum - 1) * 2 + 1 + ($s.Id % 2)
    L "INSERT INTO public.section_enrollments (""Id"", ""CourseSectionId"", ""StudentProfileId"", ""EnrolledAt"") VALUES ($enrId, $sectionId, $($s.Id), $(Q $ts));"
  }
}

# --- COURSE PROJECTS & TEAMS ---
L '-- course_projects'
for ($i = 1; $i -le 10; $i++) {
  L "INSERT INTO public.course_projects (""Id"", ""CourseId"", ""Title"", ""Description"", ""TeamSize"", ""ApplyToAllSections"", ""AllowCrossSectionTeams"", ""AiMode"", ""CreatedAt"") VALUES ($i, $i, $(Q "Capstone Project $i"), $(Q 'Team-based semester project.'), 4, false, false, 'doctor', $(Q $ts));"
  L "INSERT INTO public.course_project_sections (""Id"", ""CourseProjectId"", ""CourseSectionId"") VALUES ($i, $i, $($i * 2 - 1));"
}
L '-- course_teams & members'
$teamId = 0; $ctmId = 0
for ($ti = 1; $ti -le 4; $ti++) {
  $teamId++
  L "INSERT INTO public.course_teams (""Id"", ""CourseProjectId"", ""TeamIndex"", ""CreatedAt"") VALUES ($teamId, $ti, 1, $(Q $ts));"
  $base = ($ti - 1) * 3 + 1
  foreach ($offset in 0..2) {
    $m = $base + $offset
    if ($m -gt 45) { continue }
    $ctmId++
    $uid = $m + 1
    L "INSERT INTO public.course_team_members (""Id"", ""CourseTeamId"", ""StudentProfileId"", ""UserId"", ""MatchScore"") VALUES ($ctmId, $teamId, $m, $uid, 85);"
  }
}
$ctmId++
L "INSERT INTO public.course_team_messages (""Id"", ""CourseTeamId"", ""SenderUserId"", ""Text"", ""SentAt"") VALUES (1, 1, 2, 'Let us split frontend and backend tasks.', $(Q $ts));"

# --- GRADUATION PROJECTS ---
L '-- graduation_projects'
$gpId = 0
foreach ($s in $studentDefs) {
  if ($s.Year -notin @('Fourth Year','Fifth Year')) { continue }
  $gpId++
  if ($s.IsEng) {
    $ptype = if ($s.Year -eq 'Fifth Year') { 'GP2' } else { 'GP1' }
  } else {
    $ptype = 'GP'
  }
  $sup = (($s.Id - 1) % 12) + 1
  $hasSup = ($gpId % 3 -ne 0)
  $supVal = if ($hasSup) { $sup } else { 'NULL' }
  L "INSERT INTO public.graduation_projects (id, owner_id, name, abstract, required_skills, partners_count, created_at, updated_at, supervisor_id, project_type, preferred_roles, looking_for_teammates, required_roles, skill_priorities, abstract_file_name, abstract_file_path, abstract_file_uploaded_at, interests, technologies, abstract_file_base64, project_interests) VALUES ($gpId, $($s.Id), $(Q "$($s.Major) Capstone $gpId"), $(Q "Capstone project for $($s.Major) $($s.Year) student."), '[""React"",""PostgreSQL""]', 2, $(Q $ts), $(Q $ts), $supVal, '$ptype', NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);"
}

# GP members & invitations & supervisor requests
L '-- graduation_project_members'
$gpmId = 0
for ($g = 1; $g -le $gpId; $g++) {
  $owner = ($studentDefs | Where-Object { $_.Year -in @('Fourth Year','Fifth Year') })[$g-1]
  if ($null -eq $owner) { continue }
  $mate = (($owner.Id + 3) % 45); if ($mate -eq 0) { $mate = 1 }
  if ($mate -ne $owner.Id) {
    $gpmId++
    L "INSERT INTO public.graduation_project_members (id, project_id, student_id, role, joined_at) VALUES ($gpmId, $g, $mate, 'member', $(Q $ts));"
  }
}
if ($gpId -ge 2) {
  L "INSERT INTO public.project_invitations (id, project_id, sender_id, receiver_id, status, created_at) VALUES (1, 1, $(($studentDefs | Where-Object Year -eq 'Fourth Year' | Select-Object -First 1).Id), $(($studentDefs | Where-Object Year -eq 'Fourth Year' | Select-Object -Skip 1 -First 1).Id), 'pending', $(Q $ts));"
}
L "INSERT INTO public.supervisor_requests (id, project_id, doctor_id, sender_id, status, created_at) VALUES (1, 1, 1, $(($studentDefs | Where-Object Year -eq 'Fourth Year' | Select-Object -First 1).Id), 'pending', $(Q $ts));"

# --- COMPANY REQUESTS & RECOMMENDATIONS ---
L '-- company_requests'
$reqId = 0; $roleId = 0; $runId = 0; $recId = 0
foreach ($c in $companies) {
  foreach ($rt in @('draft','published')) {
    $reqId++
    $st = if ($rt -eq 'draft') { 'draft' } else { 'published' }
    $sub = if ($rt -eq 'published') { $(Q $ts) } else { 'NULL' }
    L "INSERT INTO public.company_requests (id, company_profile_id, request_type, status, wizard_step, title, description, category, category_choice, category_other, duration_ongoing, duration_value, duration_unit, duration_label, collaboration_format, scope_notes, matching_status, matched_at, created_at, updated_at, submitted_at) VALUES ($reqId, $($c.Id), 'project', '$st', 5, $(Q ($c.Name + ' Internship ' + $reqId)), $(Q 'Looking for student collaborators.'), 'Software', 'Software', NULL, false, 3, 'months', '3 months', 'hybrid', NULL, NULL, NULL, $(Q $ts), $(Q $ts), $sub);"
    $roleId++
    L "INSERT INTO public.company_request_roles (id, company_request_id, client_role_key, sort_order, role_name, notes) VALUES ($roleId, $reqId, 'dev', 0, 'Developer', NULL);"
    L "INSERT INTO public.company_request_skills (id, company_request_role_id, sort_order, skill_name) VALUES ($roleId, $roleId, 0, 'React');"
    if ($st -eq 'published') {
      $runId++
      L "INSERT INTO public.company_request_recommendation_runs (id, company_request_id, company_profile_id, algorithm_version, status, generated_at, completed_at, error_message) VALUES ($runId, $reqId, $($c.Id), 'v1-deterministic', 'completed', $(Q $ts), $(Q $ts), NULL);"
      foreach ($rank in 1..3) {
        $recId++
        $stud = (($reqId + $rank) % 45); if ($stud -eq 0) { $stud = 1 }
        L "INSERT INTO public.company_request_recommendations (id, run_id, company_request_id, student_profile_id, rank, score, score_breakdown_json, reason_summary, highlights_json, source, created_at) VALUES ($recId, $runId, $reqId, $stud, $rank, $(90-$rank), '{""skillMatch"":85}', 'Strong fit.', '[""Available""]', 'deterministic', $(Q $ts));"
      }
    }
  }
}

# --- ORG EVENTS, MEMBERS, TEAM ---
L '-- student_organization_events'
$evId = 0; $memId = 0; $tmId = 0
foreach ($a in $assocs) {
  for ($e = 1; $e -le 2; $e++) {
    $evId++
    L "INSERT INTO public.student_organization_events (id, organization_profile_id, title, description, event_type, category, location, is_online, event_date, registration_deadline, cover_image_url, max_participants, created_at, updated_at, is_published) VALUES ($evId, $($a.Id), $(Q "$($a.Name) Event $e"), $(Q 'Campus event.'), 'workshop', 'technical', 'Engineering Building', false, '2026-09-15 10:00:00+03', '2026-09-01 10:00:00+03', NULL, 50, $(Q $ts), NULL, true);"
  }
  $lead = $studentDefs[($a.Id - 1) * 3 % 45]
  $tmId++
  L "INSERT INTO public.student_organization_team_members (id, organization_profile_id, full_name, role_title, major, image_url, linkedin_url, display_order, created_at, updated_at, source_application_id, student_profile_id) VALUES ($tmId, $($a.Id), $(Q $lead.Name), 'President', $(Q $lead.Major), NULL, NULL, 0, $(Q $ts), NULL, NULL, $($lead.Id));"
  foreach ($m in 1..3) {
    $memId++
    $sid = (($a.Id * 3 + $m) % 45); if ($sid -eq 0) { $sid = 1 }
    L "INSERT INTO public.student_organization_members (id, organization_profile_id, student_profile_id, source_application_id, role_title, accepted_at, membership_kind, team_member_id) VALUES ($memId, $($a.Id), $sid, NULL, 'Active Member', $(Q $ts), 'Member', NULL);"
  }
}

# Recruitment campaign
L '-- recruitment'
$campId = 1; $posId = 1; $qId = 1; $appId = 1
foreach ($a in $assocs) {
  L "INSERT INTO public.student_organization_recruitment_campaigns (id, organization_profile_id, title, description, application_deadline, cover_image_url, is_published, created_at, updated_at) VALUES ($campId, $($a.Id), $(Q 'Fall Recruitment'), $(Q 'Join our team.'), '2026-09-30 00:00:00+03', NULL, true, $(Q $ts), NULL);"
  L "INSERT INTO public.student_organization_recruitment_positions (id, campaign_id, role_title, needed_count, description, requirements, required_skills, display_order) VALUES ($posId, $campId, 'Member', 5, 'General member role.', NULL, NULL, 0);"
  L "INSERT INTO public.student_organization_recruitment_questions (id, campaign_id, question_title, question_type, placeholder, is_required, options, display_order, created_at, help_text, position_id) VALUES ($qId, $campId, 'Why do you want to join?', 'text', NULL, true, NULL, 0, $(Q $ts), NULL, $posId);"
  $applicant = $studentDefs[($a.Id + 2) % 45]
  L "INSERT INTO public.student_organization_recruitment_applications (id, student_profile_id, organization_profile_id, campaign_id, position_id, status, submitted_at, updated_at, accepted_at) VALUES ($appId, $($applicant.Id), $($a.Id), $campId, $posId, 'submitted', $(Q $ts), NULL, NULL);"
  L "INSERT INTO public.student_organization_recruitment_application_answers (id, application_id, question_id, answer_value) VALUES ($appId, $appId, $qId, 'Passionate about the mission.');"
  $campId++; $posId++; $qId++; $appId++
}

# --- MESSAGING ---
L '-- conversations'
$convId = 0; $cuId = 0; $msgId = 0
for ($i = 1; $i -le 10; $i++) {
  $convId++
  L "INSERT INTO public.conversations (""Id"", ""CreatedAt"", ""CourseTeamId"", ""Title"") VALUES ($convId, $(Q $ts), NULL, $(Q "Direct chat $convId"));"
  $u1 = $i + 1; $u2 = $i + 2
  if ($u2 -gt 46) { $u2 = 2 }
  $cuId++
  L "INSERT INTO public.conversation_users (""Id"", ""ConversationId"", ""UserId"") VALUES ($cuId, $convId, $u1);"
  $cuId++
  L "INSERT INTO public.conversation_users (""Id"", ""ConversationId"", ""UserId"") VALUES ($cuId, $convId, $u2);"
  $msgId++
  L "INSERT INTO public.messages (""Id"", ""ConversationId"", ""SenderId"", ""Text"", ""CreatedAt"", ""Edited"", ""Deleted"", ""Seen"") VALUES ($msgId, $convId, $u1, 'Hello - are you free to meet this week?', $(Q $ts), false, false, false);"
}

# --- FOLLOWS, POSTS, NOTIFICATIONS ---
L '-- follows and posts'
L "INSERT INTO public.company_follows (id, company_profile_id, student_profile_id, followed_at) VALUES (1, 1, 1, $(Q $ts));"
L "INSERT INTO public.organization_follows (id, organization_profile_id, student_profile_id, followed_at) VALUES (1, 1, 2, $(Q $ts));"
L "INSERT INTO public.student_posts (id, user_id, content, attachment_url, attachment_type, created_at, updated_at) VALUES (1, 2, 'Looking for GP teammates with backend experience.', NULL, NULL, $(Q $ts), $(Q $ts));"
L "INSERT INTO public.doctor_posts (id, user_id, content, attachment_url, attachment_type, created_at, updated_at) VALUES (1, 47, 'Office hours updated for capstone consultations.', NULL, NULL, $(Q $ts), $(Q $ts));"
L "INSERT INTO public.user_notifications (id, user_id, category, event_type, project_id, title, body, dedup_key, created_at, read_at) VALUES (1, 2, 'project', 'invitation_received', 1, 'Project invitation', 'You received a project invitation.', 'proj:inv:1', $(Q $ts), NULL);"

# --- SEQUENCE RESETS ---
$seqs = @{
  'users_id_seq' = 75
  'student_profiles_id_seq' = 45
  'doctor_profiles_id_seq' = 12
  'company_profiles_id_seq' = 6
  'student_association_profiles_id_seq' = 5
  'skills_id_seq' = 50
  'student_skills_id_seq' = $ssId
  '"section_enrollments_Id_seq"' = $enrId
  'graduation_projects_id_seq' = $gpId
  'company_requests_id_seq' = $reqId
  'company_request_recommendations_id_seq' = $recId
  'student_organization_events_id_seq' = $evId
  '"messages_Id_seq"' = $msgId
  '"conversations_Id_seq"' = $convId
}
L ''
foreach ($kv in $seqs.GetEnumerator()) {
  $seqName = if ($kv.Key.StartsWith('"')) { "public.$($kv.Key)" } else { "public.$($kv.Key)" }
  L "SELECT pg_catalog.setval('$seqName', $($kv.Value), true);"
}
L 'COMMIT;'

# Pre-write name uniqueness checks
$studentDup = ($studentDefs | ForEach-Object { $_.Name } | Group-Object | Where-Object { $_.Count -gt 1 }).Count
$doctorDup = ($doctorDefs | ForEach-Object { $_.Name } | Group-Object | Where-Object { $_.Count -gt 1 }).Count
$memberDup = ($companies | ForEach-Object { $_.Member } | Group-Object | Where-Object { $_.Count -gt 1 }).Count
if ($studentDup -gt 0 -or $doctorDup -gt 0 -or $memberDup -gt 0) {
  throw "Duplicate names detected: students=$studentDup doctors=$doctorDup members=$memberDup"
}
$allPersonNames = @($studentDefs.Name) + @($doctorDefs.Name) + @($companies.Contact) + @($companies.Member)
$globalDup = ($allPersonNames | Group-Object | Where-Object { $_.Count -gt 1 }).Count
if ($globalDup -gt 0) { throw "Cross-role duplicate full names: $globalDup" }

[System.IO.File]::WriteAllText($outPath, ($buf -join "`n"), [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $outPath ($($buf.Count) blocks)"
Write-Host "Students: $($studentDefs.Count) unique names; Doctors: $($doctorDefs.Count); Company members: $($companies.Count)"
