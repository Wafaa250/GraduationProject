# Student frontend ↔ backend wiring review

**Date:** 2026-05-22  
**Scope:** Student shell routes, Lovable-migrated pages, API alignment with `GraduationProject.API`.

---

## Summary

Most student flows are correctly wired. Critical paths (graduation workspace, courses, team chat, invitations, messages, profile, students, doctors, organizations) match backend controllers.

**Fixes applied in this review:**

1. **Team leader permissions** — `myRole` now derives from member `role === "leader"`, not only envelope `owner` | `member`.
2. **Dashboard hero** — Removed broken `/channels/*` fetch; browse modal uses `GET /graduation-projects`.
3. **Dashboard navigation** — Hero/stat cards link to `/students`, `/student/graduation-project`, `/student/team-invitations`; removed dead “Explore projects” modal trigger.
4. **Security** — Removed JWT `console.log` from axios interceptor.

---

## Verified OK

| Area | Frontend | Backend |
|------|----------|---------|
| Dashboard summary | `GET /dashboard/summary` | `DashboardController` |
| Graduation workspace | `GET /graduation-projects/my`, CRUD, members, leader, AI, supervisor | `StudentProjectController`, `AiController` |
| Create/edit project dialog | `POST/PUT /graduation-projects` | Same |
| GP invitations | `GET /invitations/received`, accept/reject, invite | `InvitationsController`, `StudentProjectController` |
| Course hub | `GET /courses/enrolled`, `/{id}`, `/{id}/students`, `/{id}/projects` | `CoursesController` |
| Manual / AI team | manual-team + ai-team-recommendations + requests | `CoursesController` |
| Course team invitations | `GET/POST /courses/team-invitations/*` | `CoursesController` |
| Team page | `GET /courses/projects/{id}/my-team`, `GET/POST /teams/{id}/chat` | `CoursesController`, `TeamChatController` |
| Messages | REST + SignalR `/hubs/notifications` | `ConversationsController`, `MessagesController` |
| Students browse + invite | `GET /students`, `POST .../invite` | `StudentsController`, GP invite |
| Doctors | `GET /doctors` | `DoctorsController` |
| Search | `GET /search` | `SearchController` |
| Profile (me) | `GET /me`, `PUT /profile` | `MeController`, `ProfileController` |
| Public profile | `GET /students/{id}`, `GET /graduation-projects?studentId=` | Same |
| Organizations | discovery + follow APIs | `OrganizationsController`, `StudentsController` |
| Notifications | `GET /notifications?category=graduation_project` | `NotificationsController` |
| Sidebar routes | Match `App.tsx` student layout | — |

---

## Known limitations (not broken if unused)

### Legacy dashboard course-teams modal

`DashboardPage.tsx` still contains a large **Course Teams** modal that calls `studentCoursesApi` helpers for endpoints the backend does **not** expose (`/courses/{id}/my-team`, `partner-requests`, `leave`, etc.). The modal is **not opened** from the UI today (no `setCourseTeamsModalOpen(true)`). Use **`/student/courses`** for all course team work.

### Duplicate graduation fetch on dashboard

Dashboard loads `GET /dashboard/summary` and `GET /graduation-projects/my` for the hero card. Acceptable for rich preview; could be optimized later.

### `studentCoursesApi.getCourseStudentView`

`GET /courses/{id}/student-view` — **no backend route**; unused in pages.

### Invitations page `invalidateQueries(["dashboard-summary"])`

No React Query consumer on student dashboard — harmless no-op after accept.

### Two profile UIs

- `/profile` — own profile (Lovable `StudentMyProfileView`)
- `/students/:studentId` — public `ProfilePage` (works with search `userId`)
- `/students/profile/:userId` — `StudentProfilePage` (in-shell alternate)

Global search uses `/students/{id}` → public profile route (outside shell but functional).

---

## Manual test checklist

1. **Login as student** → `/dashboard` loads stats, invitations, project preview.
2. **Graduation Project** (sidebar) → workspace loads; **Create project** dialog submits; team tab shows members; AI tabs run recommend + invite/request.
3. **Courses** → enroll list, course detail, projects, team-choice → manual/AI team → send request.
4. **Team invitations** → accept GP and course invites.
5. **Messages** → list conversations, send message, realtime update.
6. **Students** → filter, open profile, send GP invite (with active project).
7. **Supervisors** → list, open profile, request from graduation workspace.
8. **Organizations** → discover, follow.

---

## API base URL

`frontend/src/api/axiosInstance.ts` → `http://localhost:5262/api` (must match running API).
