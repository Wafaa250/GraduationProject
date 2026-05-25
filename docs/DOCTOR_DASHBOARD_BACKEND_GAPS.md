# Doctor Dashboard — Backend Gaps

**Date:** 2026-05-23  
**Scope:** Doctor hub (`/doctor/*`) after final frontend integration pass  
**Rule:** Features listed here have **no sufficient existing API** for the product UI that was removed or deferred. Do not fake these in the frontend.

---

## Connected in this pass (no new backend required)

| Feature | APIs used |
|--------|-----------|
| Dashboard metrics & sections | `GET /api/doctors/me/dashboard-summary`, `requests`, `supervised-projects`, `GET /api/courses/my` + per-course counts, `GET /api/conversations` |
| Accept / reject supervision | `POST /api/supervisor-requests/{id}/accept\|reject` |
| Cancel supervision queue | `GET /api/doctors/me/supervisor-cancel-requests`, `POST /api/supervisor-cancel-requests/{id}/accept\|reject` |
| Resign supervision | `POST /api/doctors/me/resign-supervision/{projectId}` |
| Header search | `GET /api/search?query=` → `GET /api/students/{userId}` for student hits |
| Profile / edit | `GET /api/me`, `PUT /api/profile/doctor` |
| Messages | `GET /api/conversations`, `GET /api/conversations/{id}`, `POST /api/messages`, `POST /api/messages/{id}/seen` |
| Notifications | `GET /api/notifications`, unread count, `POST /api/notifications/{id}/read` |
| Project detail / team | `GET /api/doctors/me/supervised-projects` (list), `GET /api/graduation-projects/{id}/members` |
| Course list / summary detail | `GET /api/courses/my`, `GET /api/courses/{id}`, section/student/project counts |

---

## 1. Project progress tracking

**Why existing APIs are insufficient:**  
`GET /api/doctors/me/supervised-projects` returns identity, skills, owner, `memberCount`, and timestamps only. There is no completion percentage, phase, or deliverable status.

**Exact DTO fields required (per supervised project):**

```json
{
  "projectId": 0,
  "progressPercent": 0,
  "currentPhase": "string",
  "lastActivityAt": "ISO-8601"
}
```

**Suggested endpoint:**  
`GET /api/doctors/me/supervised-projects` — extend each item, or  
`GET /api/doctors/me/supervised-projects/{projectId}/progress`

**Estimated effort:** Medium (2–3 days) — requires domain model for milestones/tasks or computed progress from submissions.

---

## 2. Project health status

**Why existing APIs are insufficient:**  
No health/risk/at-risk signal exists on supervised projects or graduation projects for the doctor role.

**Exact DTO fields required:**

```json
{
  "projectId": 0,
  "healthStatus": "on_track | at_risk | blocked",
  "healthReason": "string | null",
  "evaluatedAt": "ISO-8601"
}
```

**Suggested endpoint:**  
`GET /api/doctors/me/supervised-projects` (embedded `health`) or dedicated  
`GET /api/doctors/me/supervised-projects/health-summary`

**Estimated effort:** Medium–High (3–5 days) — needs rules (deadlines, inactivity, missing supervisor reviews) or manual doctor/student flags.

---

## 3. Milestone management

**Why existing APIs are insufficient:**  
No milestone entity or timeline is exposed to doctors. UI timeline widgets were removed because they would be fabricated.

**Exact DTO fields required:**

```json
{
  "projectId": 0,
  "milestones": [
    {
      "milestoneId": 0,
      "title": "string",
      "dueDate": "ISO-8601 | null",
      "status": "pending | in_progress | completed",
      "completedAt": "ISO-8601 | null",
      "sortOrder": 0
    }
  ]
}
```

**Suggested endpoints:**

- `GET /api/graduation-projects/{projectId}/milestones`
- `POST /api/graduation-projects/{projectId}/milestones`
- `PATCH /api/graduation-projects/milestones/{milestoneId}`

**Estimated effort:** High (5–8 days) — schema, permissions (doctor vs student), notifications.

---

## 4. Authoritative students supervised count

**Why existing APIs are insufficient:**  
`GET /api/doctors/me/dashboard-summary` exposes `supervisedCount` (projects) but not a distinct **student headcount**. The dashboard derives “Students Supervised” as unique project **owners** from `supervised-projects`, which undercounts co-leaders and overcounts one student with multiple projects.

**Exact DTO fields required:**

```json
{
  "studentsSupervisedCount": 0,
  "distinctStudentIds": [0]
}
```

**Suggested endpoint:**  
Extend `GET /api/doctors/me/dashboard-summary` with `studentsSupervisedCount`.

**Estimated effort:** Small (0.5–1 day) — SQL count distinct members/owners across supervised projects.

---

## 5. Full project member roster on dashboard cards

**Why existing APIs are insufficient:**  
List endpoint returns owner-focused data and `memberCount` only. `GET /api/graduation-projects/{id}/members` exists but is not on the list DTO; dashboard cards show owner initials only.

**Exact DTO fields required (on each supervised project list item):**

```json
{
  "members": [
    { "studentId": 0, "userId": 0, "name": "string", "role": "leader | member", "major": "string", "avatarUrl": "string | null" }
  ]
}
```

**Suggested endpoint:**  
Extend `GET /api/doctors/me/supervised-projects` payload (preferred) or document mandatory N+1 calls to `GET /api/graduation-projects/{id}/members`.

**Estimated effort:** Small (1 day) — include members in existing query with `.Include`.

---

## 6. Doctor settings module

**Why existing APIs are insufficient:**  
Sidebar “Settings” routes to **Edit Profile** (`PUT /api/profile/doctor`) only. There is no API for account preferences: email notifications, default semester, office hours visibility, theme, or password change under a doctor settings resource.

**Exact DTO fields required:**

```json
{
  "emailNotificationsEnabled": true,
  "digestFrequency": "immediate | daily | weekly",
  "defaultSemesterId": "string | null",
  "showOfficeHoursOnProfile": true,
  "locale": "string"
}
```

**Suggested endpoints:**

- `GET /api/doctors/me/settings`
- `PUT /api/doctors/me/settings`
- Password change: reuse existing auth endpoint if present, or `POST /api/auth/change-password`

**Estimated effort:** Medium (2–4 days) — new table or JSON column on doctor profile + validation.

---

## 7. Dedicated doctor activity feed

**Why existing APIs are insufficient:**  
Activity Feed UI was **removed**. Notifications (`GET /api/notifications?category=`) are not a chronological activity stream of supervision, course, and project events unless every event emits a notification.

**Exact DTO fields required:**

```json
{
  "items": [
    {
      "activityId": 0,
      "type": "supervision_request | project_update | course_enrollment | message",
      "title": "string",
      "summary": "string",
      "entityType": "project | course | request",
      "entityId": 0,
      "actorName": "string",
      "createdAt": "ISO-8601"
    }
  ]
}
```

**Suggested endpoint:**  
`GET /api/doctors/me/activity?take=20&cursor=`

**Estimated effort:** Medium–High (3–5 days) — aggregation layer or unified audit log.

---

## 8. Online presence / status indicator

**Why existing APIs are insufficient:**  
No presence, last-seen, or WebSocket status for users. Sidebar presence dot was removed.

**Exact DTO fields required:**

```json
{
  "userId": 0,
  "status": "online | away | offline",
  "lastSeenAt": "ISO-8601"
}
```

**Suggested endpoint:**  
`GET /api/users/presence?ids=1,2,3` or SignalR hub `UserPresenceUpdated`.

**Estimated effort:** High (5+ days) — real-time infrastructure.

---

## 9. Colleague (doctor) public profile from search

**Why existing APIs are insufficient:**  
`GET /api/search` returns doctor `userId`, but there is no `GET /api/doctors/{userId}` (or equivalent) for read-only colleague profiles in the hub. Search for other faculty only shows a toast.

**Exact DTO fields required:**

```json
{
  "userId": 0,
  "name": "string",
  "email": "string",
  "department": "string",
  "faculty": "string",
  "specialization": "string",
  "bio": "string",
  "technicalSkills": ["string"],
  "researchSkills": ["string"],
  "officeHours": "string | null",
  "profilePictureBase64": "string | null"
}
```

**Suggested endpoint:**  
`GET /api/doctors/{userId}` (Allow doctors authenticated)

**Estimated effort:** Small (1 day) — mirror student profile read pattern.

---

## 10. Start conversation from search / student profile

**Why existing APIs are insufficient:**  
Conversations are listed via `GET /api/conversations` but there is no documented `POST /api/conversations` (or direct-message create) to open a thread with a student found in search.

**Exact DTO fields required:**

```json
{
  "conversationId": 0,
  "participantUserIds": [0]
}
```

**Suggested endpoint:**  
`POST /api/conversations` with `{ "participantUserId": 0 }` or reuse course-team conversation rules.

**Estimated effort:** Medium (2–3 days) — match existing messaging authorization model.

---

## 11. Full course management workspace (doctor hub)

**Why existing APIs are insufficient:**  
Backend exposes rich course APIs (`sections`, `enrolled-students`, `projects`, teams, AI recommendations, invitations) under `CoursesController`, but the doctor hub only implements **list + aggregate counts + read-only course detail**. Legacy full UI was not ported.

**Exact DTO fields required:**  
Use existing course DTOs; no new fields — need stable paginated list endpoints for:

- Sections CRUD: `GET/POST /api/courses/{courseId}/sections`
- Section students: `GET/POST courses/sections/{sectionId}/students`
- Course projects & teams: `GET/POST /api/courses/{courseId}/projects/...`

**Suggested endpoint:**  
No new endpoints — **frontend port** of course workspace against existing `api/courses/*`.

**Estimated effort:** High (8–15 days frontend); backend **Small** unless gaps found during port.

---

## 12. Project feedback / workspace for doctor

**Why existing APIs are insufficient:**  
“Open” on a project navigates to a doctor detail page with team list and resign only. There is no doctor-scoped graduation project workspace (reviews, files, chat tied to project) comparable to the student workspace.

**Exact DTO fields required:**  
Reuse graduation project workspace DTOs if doctor role is authorized; otherwise define:

```json
{
  "projectId": 0,
  "supervisorNotes": "string",
  "submissions": [{ "submissionId": 0, "title": "string", "submittedAt": "ISO-8601", "status": "string" }]
}
```

**Suggested endpoint:**  
`GET /api/graduation-projects/{projectId}/doctor-workspace` or extend existing project GET with role-based sections.

**Estimated effort:** High (5–10 days) — permissions + UI surface.

---

## 13. Current teaching semester on profile

**Why existing APIs are insufficient:**  
`GET /api/me` doctor branch has no `currentSemester`. Courses overview subtitle uses first course’s `semester` when available.

**Exact DTO fields required:**

```json
{
  "currentSemester": "string",
  "currentAcademicYear": "string"
}
```

**Suggested endpoint:**  
Extend `GET /api/me` doctor payload or `dashboard-summary`.

**Estimated effort:** Small (0.5 day).

---

## 14. Filter / pagination on supervision requests

**Why existing APIs are insufficient:**  
`GET /api/doctors/me/requests` returns full list with no `status`, `page`, or `search` query params. Disabled Filter/New buttons were removed from dashboard; requests page shows all rows.

**Exact DTO fields required:**  
Query: `?status=pending&page=1&pageSize=20`  
Response: `{ "items": [...], "totalCount": 0 }`

**Suggested endpoint:**  
Extend `GET /api/doctors/me/requests` with pagination metadata.

**Estimated effort:** Small (1 day).

---

## Removed UI (intentional — do not reintroduce without backend)

- Activity Feed section  
- Online status / presence dot  
- Fake project health, risk badges, milestone timelines, progress bars  
- Notifications metric card (bell + sidebar remain)  
- Header bulk CTAs (replaced by profile menu + in-page links)

---

## Priority recommendation

| Priority | Gap | Effort |
|----------|-----|--------|
| P1 | Authoritative `studentsSupervisedCount` on dashboard-summary | S |
| P1 | Supervised-projects `members[]` on list DTO | S |
| P2 | Colleague doctor profile `GET /api/doctors/{userId}` | S |
| P2 | Create conversation from student lookup | M |
| P2 | Full course workspace port (existing APIs) | L (FE) |
| P3 | Progress %, health, milestones | M–H |
| P3 | Doctor settings module | M |
| P4 | Activity feed API, presence | M–H |

---

*Frontend integration completed against existing APIs; this document is the single source of truth for remaining backend work.*
