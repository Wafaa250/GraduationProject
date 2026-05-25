# Doctor Dashboard Audit

Audit date: 2026-05-23  
Scope: Web doctor hub (`frontend/src/pages/doctor/DoctorDashboardPage.tsx`, `DoctorHubLayout`, hub components).  
Rules: Existing backend only; no new APIs; no mock data; no backend changes.

---

## SECTION: Doctor profile (sidebar + header)

**Status:** Connected

**Backend endpoint used:**
- `GET /api/me` (doctor branch via `MeController`)

**Frontend integration:**
- `getDoctorMe()` in `frontend/src/api/meApi.ts`
- `DoctorHubProfileProvider` + `mapDoctorMeToProfile()` in `frontend/src/lib/doctorHubMappers.ts`
- `DoctorHubSidebar`, `DoctorHubHeader`

**Missing items:** None for displayed fields. `semester` in header stays `"—"` (no current-term field on doctor profile DTO).

**Required backend work:** Optional: expose current teaching semester on `/api/me` or derive from course list in UI (courses API has `semester` per course).

---

## SECTION: Alert banner (pending supervision queue)

**Status:** Connected

**Backend endpoint used:**
- `GET /api/doctors/me/dashboard-summary` → `pendingRequestsCount`

**Frontend integration:**
- `DoctorDashboardPage` loads summary and renders dynamic copy; scroll-to-requests when count &gt; 0.

**Missing items:** `pendingCancelCount` from summary is not surfaced in the banner (no UI slot for cancel requests).

**Required backend work:** Optional dashboard section for supervisor cancellation queue using `GET /api/doctors/me/supervisor-cancel-requests` (exists on `StudentProjectController`).

---

## SECTION: Metric cards (6 tiles)

**Status:** Connected (with one derived metric)

**Backend endpoints used:**
| Metric | Source |
|--------|--------|
| Pending Requests | `GET /api/doctors/me/dashboard-summary` → `pendingRequestsCount` |
| Active Projects | `GET /api/doctors/me/dashboard-summary` → `supervisedCount` |
| Courses | `GET /api/courses/my` (count) |
| Students Supervised | Derived: unique `owner.studentId` from `GET /api/doctors/me/supervised-projects` |
| Unread Messages | `GET /api/conversations` → sum `unseenCount` |
| Notifications | `GET /api/notifications/unread-count?category=` × `graduation_project`, `course`, `chat` |

**Frontend integration:**
- `DoctorDashboardPage` + `doctorHubConfig.ts` slot labels
- `doctorCoursesApi.ts`, `conversationsApi.ts`, `notificationsApi.ts`

**Missing items:** No dedicated `studentsSupervisedCount` on dashboard-summary; count is approximate (project owners only, not all team members).

**Required backend work:** Add `studentsSupervisedCount` (or enrolled students under supervision) to `dashboard-summary` if product needs an authoritative number.

---

## SECTION: Recent supervision requests

**Status:** Connected

**Backend endpoints used:**
- `GET /api/doctors/me/requests`
- `POST /api/supervisor-requests/{id}/accept`
- `POST /api/supervisor-requests/{id}/reject`

**Frontend integration:**
- `doctorDashboardApi.ts`, `RequestCard`, accept/reject handlers with reload + toast

**Missing items:**
- Filter / New buttons: disabled (no list filters or create-request API for doctors on this screen)
- Details button: disabled (no single-request detail endpoint beyond list payload)

**Required backend work:** Only if product needs filtering, pagination, or a dedicated request detail view.

---

## SECTION: Activity feed

**Status:** Partial

**Backend endpoints used:**
- `GET /api/notifications?take=&category=` for `graduation_project`, `course`, `chat` (merged client-side)

**Frontend integration:**
- `getDoctorNotificationsForActivity()`, `mapNotificationToActivity()`, `ActivityFeed`

**Missing items:**
- No dedicated doctor activity/timeline API
- Feed is notification-shaped only (not project milestones, supervision events unless they emit notifications)
- Click-through / mark-read not wired on dashboard

**Required backend work:** Optional `GET /api/doctors/me/activity` aggregate, or ensure all desired events create notifications; wire `POST /api/notifications/{id}/read` in UI if inbox behavior is needed.

---

## SECTION: Active projects

**Status:** Partial

**Backend endpoint used:**
- `GET /api/doctors/me/supervised-projects`

**Frontend integration:**
- `mapSupervisedProjectToCard()`, `ProjectCard` (progress/risk hidden when null)

**Missing items:**
- Progress %, milestone, risk status (not in API)
- Full member avatar list (API returns owner + `memberCount` only)
- View all / Open / Feedback / View Team actions: disabled (no doctor project detail route wired from hub)
- Resign supervision: API exists (`POST /api/doctors/me/resign-supervision/{projectId}`) but no dashboard control

**Required backend work:** Extend supervised-projects DTO with members[], progress/milestone if Lovable cards should show them; add doctor project detail page route (frontend-only wiring to existing graduation-project APIs if applicable).

---

## SECTION: Courses overview

**Status:** Connected

**Backend endpoints used:**
- `GET /api/courses/my`
- `GET /api/courses/{courseId}/sections` (count)
- `GET /api/courses/{courseId}/enrolled-students` (count)
- `GET /api/courses/{courseId}/projects` (count)

**Frontend integration:**
- `getDoctorCoursesWithStats()`, `CourseCard`

**Missing items:** Manage courses CTA disabled (no dedicated doctor courses management route in hub router).

**Required backend work:** None for dashboard display; optional frontend routes to existing course management pages.

---

## SECTION: Sidebar navigation badges

**Status:** Connected

**Backend endpoints used:** Same as metrics (summary, courses, conversations, notifications unread).

**Frontend integration:** `DoctorHubSidebar` parallel fetch on mount.

**Missing items:** Nav items only update local `active` state — no route changes for Requests / Projects / Courses / Messages / Notifications sections.

**Required backend work:** None for counts; frontend routes/pages if each nav item should be its own URL.

---

## SECTION: Sidebar footer (Profile / Settings / Logout)

**Status:** Partial

**Backend endpoint used:** Logout is client-side session clear (`authSession.logout`), not a backend route.

**Frontend integration:** Logout wired; Profile and Settings buttons have no navigation.

**Missing items:** Doctor profile edit page route; settings page.

**Required backend work:** `GET/PATCH /api/me` or doctor profile update endpoints already exist elsewhere — wire routes only.

---

## SECTION: Header search

**Status:** Missing (UI placeholder)

**Backend endpoint available (not wired):**
- `GET /api/search` (`SearchController`) — global search

**Frontend integration:** Disabled input in `DoctorHubHeader`.

**Missing items:** Search handler, results UI, debouncing.

**Required backend work:** None if search API already covers projects/students/requests for doctors; confirm doctor-relevant result types in `SearchController`.

---

## SECTION: Header CTAs (Manage Courses / Open Projects / Review Requests)

**Status:** Missing (UI only)

**Backend endpoint used:** None wired.

**Missing items:** Target routes or deep links; Review Requests could scroll to `#doctor-requests-section` (not wired from header).

**Required backend work:** None — frontend navigation only.

---

## SECTION: Messages (sidebar item + metric)

**Status:** Connected (count only)

**Backend endpoint used:**
- `GET /api/conversations`

**Frontend integration:** Unread sum in metrics and sidebar badge.

**Missing items:** No messages inbox UI on doctor hub; no navigation to conversation threads.

**Required backend work:** None for counts; use existing `GET /api/conversations/{id}`, `MessagesController` for a messages page.

---

## SECTION: Notifications (sidebar item + metric)

**Status:** Connected (count + activity feed partial)

**Backend endpoints used:**
- `GET /api/notifications/unread-count?category=`
- `GET /api/notifications?category=`

**Frontend integration:** Unread total; activity feed slice.

**Missing items:** Full notifications panel/page; mark-as-read on dashboard.

**Required backend work:** Optional dedicated doctor notifications page (reuse existing notification APIs).

---

## SECTION: Supervisor cancellation requests

**Status:** Missing (no dashboard section)

**Backend endpoint available:**
- `GET /api/doctors/me/supervisor-cancel-requests`
- Summary field: `pendingCancelCount` on `dashboard-summary`

**Frontend integration:** Not displayed.

**Missing items:** UI section and list cards; accept/reject cancel flows if exposed elsewhere.

**Required backend work:** Confirm accept/reject endpoints for cancellation requests; add UI section when product prioritizes.

---

## SECTION: Request / project / course section actions (Filter, New, View all, etc.)

**Status:** Missing (intentionally disabled)

**Backend:** No doctor-hub-specific list mutation beyond accept/reject.

**Required backend work:** Product decision: remove disabled buttons or wire to existing list/detail routes.

---

## Summary table

| Section | Status |
|---------|--------|
| Doctor profile | ✅ Connected |
| Alert banner | ✅ Connected |
| Metric cards | ✅ Connected (students derived) |
| Supervision requests | ✅ Connected |
| Activity feed | ⚠ Partial |
| Active projects | ⚠ Partial |
| Courses overview | ✅ Connected |
| Sidebar badges | ✅ Connected |
| Sidebar nav routes | ❌ Missing (UI state only) |
| Logout | ✅ Connected |
| Profile / Settings nav | ❌ Missing (routes) |
| Header search | ❌ Missing (API exists) |
| Header CTAs | ❌ Missing (navigation) |
| Messages inbox | ❌ Missing (count only) |
| Notifications inbox | ⚠ Partial |
| Cancel requests queue | ❌ Missing (API exists) |
| Disabled row/card actions | ❌ Missing (navigation/detail APIs) |

---

## Files touched for backend integration

- `frontend/src/pages/doctor/DoctorDashboardPage.tsx` — main data load and actions
- `frontend/src/api/doctorDashboardApi.ts`
- `frontend/src/api/doctorCoursesApi.ts`
- `frontend/src/api/conversationsApi.ts`
- `frontend/src/api/notificationsApi.ts` (doctor helpers)
- `frontend/src/api/meApi.ts`
- `frontend/src/lib/doctorHubMappers.ts`
- `frontend/src/components/doctor/hub/*` (profile context, sidebar, header, cards)

No backend files were modified.
