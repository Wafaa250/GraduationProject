# Doctor Hub — Lovable UI Migration Report

**Reference design:** `skillswap-doctor-hub-main` (Lovable ZIP, extracted to `_lovable_ref/`)  
**Target codebase:** `frontend/` (existing SkillSwap app)  
**Scope:** Doctor role only (Lovable project is a doctor-only hub).

**Critical constraint:** Lovable `src/lib/api/services.ts` is **100% mock data**. Nothing from that layer may be copied into the app. Only UI components, layout, CSS tokens, and JSX structure are ported; all data must continue to flow through existing `frontend/src/api/*` modules.

---

## Architecture comparison

| Aspect | Current SkillSwap | Lovable reference |
|--------|-------------------|-------------------|
| Routing | Multi-route app; doctor hub = `/doctor-dashboard` + section state + `?tab=my-courses` | Nested routes under `DoctorLayout` (`/`, `/courses`, `/supervision/*`, …) |
| Doctor shell | Custom `DoctorDashboardLayout` + inline CSS (`doctorDashTokens`, `doctor-dashboard.css`) | shadcn `SidebarProvider` + `AppSidebar` + `Topbar` + Tailwind |
| State / data | `useState` + `useCallback` + axios (`doctorDashboardApi`, `supervisorApi`, `doctorCoursesApi`) | `useEffect` + mock `services.ts` |
| UI kit | Mixed inline styles + some shadcn under `app/components/ui` | Full shadcn + `index.css` HSL design tokens |

**Migration rule:** Keep SkillSwap routes and APIs. Reskin doctor surfaces to match Lovable; optionally sync dashboard sections to `?section=` query params (no route tree replacement).

---

## Page mapping

| # | Existing SkillSwap page / surface | Lovable page | Match quality | Files to update | Files to remove | Files to keep | Backend integrations |
|---|-----------------------------------|--------------|---------------|-----------------|-----------------|---------------|------------------------|
| 1 | `DoctorDashboardLayout` + `Sidebar` + `Header` | `DoctorLayout` + `AppSidebar` + `Topbar` | **Direct** (shell) | `dashboard/DoctorDashboardLayout.tsx`, new `components/doctor/hub/*` | None (deprecate old sidebar CSS gradually) | `DoctorDashboardPage.tsx`, all section components | None (layout only) |
| 2 | `OverviewSection` (dashboard tab) | `pages/doctor/Dashboard.tsx` | **Strong** | `dashboard/OverviewSection.tsx`, `ui/StatCard.tsx` | None | `doctorDashboardApi`, `supervisorApi`, handlers in `DoctorDashboardPage` | `GET /api/me`, `GET /api/doctors/me/dashboard-summary`, requests + supervised projects for activity |
| 3 | `DoctorCoursesSection` + `DoctorCoursesPage` + `CreateCoursePage` | `MyCourses.tsx` | **Strong** | `DoctorCoursesSection.tsx`, `CreateCoursePage.tsx`, `DoctorCoursesPage.tsx` | None | `doctorCoursesApi` (`GET/POST /api/courses/*`) | `GET /api/courses/my`, `POST /api/courses` |
| 4 | `CourseWorkspacePage` | `CourseWorkspace.tsx` | **Strong** | `courses/CourseWorkspacePage.tsx` | None | `doctorCoursesApi`, section/project APIs | Course detail, sections, projects CRUD |
| 5 | `CreateSectionForm` / section UI in workspace | Section UI in `CourseWorkspace` | **Partial** | `CreateSectionForm.tsx`, workspace tabs | None | `POST /api/courses/{id}/sections` | Section create/list |
| 6 | `SectionStudentsPage` | Section students panel in workspace | **Strong** | `SectionStudentsPage.tsx` | None | `GET/POST .../sections/{id}/students` | Enroll students |
| 7 | `StudentsPage` | `StudentDirectory.tsx` | **Strong** | `students/StudentsPage.tsx` | None | `GET /api/students` | Student list/search (doctor allowed) |
| 8 | `StudentProfilePage` | `StudentProfile.tsx` | **Strong** | `students/StudentProfilePage.tsx` | None | `GET /api/students/{userId}` | Full student profile |
| 9 | `RequestsSection` | `SupervisionRequests.tsx` | **Strong** | `RequestsSection.tsx` | None | `supervisorApi` accept/reject | `GET /api/doctors/me/requests`, cancel requests |
| 10 | `ProjectsSection` | `SupervisedProjects.tsx` | **Strong** | `ProjectsSection.tsx` | None | `doctorDashboardApi`, `removeDoctorSupervision` | `GET /api/doctors/me/supervised-projects`, resign |
| 11 | Cancel rows inside `RequestsSection` | `CancellationRequests.tsx` | **Partial** (merged in current app) | `RequestsSection.tsx` (add tabs/filter UI) | None | `supervisorApi` cancel accept/reject | `GET /api/doctors/me/supervisor-cancel-requests` |
| 12 | No dedicated browse page | `BrowseGraduationProjects.tsx` | **Gap** | New thin page or dashboard section (future) | — | `GET /api/graduation-projects` | Browse all GP (doctor can call today) |
| 13 | `GradProjectNotificationBell` + `DoctorNotificationsPage` | `Notifications.tsx` | **Strong** | `DoctorNotificationsPage.tsx`, `notificationPresentation.ts`, `notificationsApi` inbox helpers, `doctorHubNav` | None | `notificationsApi`, SignalR hub | `GET /api/notifications`, unread-count, read, read-all |
| 14 | `DoctorProfilePage` + `EditDoctorProfilePage` | `ProfileSettings.tsx` | **Strong** | Reskinned pages + `doctorProfileMappers`, `DoctorProfileView`, skill tag field | None | `GET /api/me`, `GET /api/doctors/{id}`, `PUT /api/profile/doctor` | Doctor profile |
| 15 | `CourseProjectCreatePage`, `ProjectTeamsPage`, `TeamManagementPage` | Project/team UI in workspace | **Strong** | `courses/*` doctor team pages | None | `doctorCoursesApi` teams/generate | Course project + team APIs |
| 16 | `ChannelPage` / conversations | Team conversation in Lovable | **Partial** | `ChannelPage.tsx`, `CourseTeamConversations` | None | `POST /api/course-teams/{id}/conversation` | Team chat |
| 17 | `DeletedProjectsSection` | — | **SkillSwap-only** | Keep; style only | None | localStorage | Client-only archive |
| 18 | `DoctorProjectDetailsPage`, `ProjectWorkspacePage` | — | **Extra in SkillSwap** | Restyle later | None | `gradProjectApi` | GP detail workspace |

---

## Lovable files — do not copy verbatim

| Lovable path | Action |
|--------------|--------|
| `src/lib/api/mock-data.ts` | **Do not import** |
| `src/lib/api/services.ts` | **Do not import** (stubs only) |
| `src/pages/**/*.tsx` | Use as **visual reference**; merge into existing pages |
| `src/App.tsx` routes | **Do not replace** `frontend/src/app/App.tsx` |
| `src/components/ui/*` | Prefer existing `frontend/src/app/components/ui/*` (already present) |

---

## Route mapping (preserve SkillSwap URLs)

| Lovable route | SkillSwap route (keep) |
|---------------|-------------------------|
| `/` | `/doctor-dashboard` (`?section=overview`) |
| `/courses` | `/doctor-dashboard?section=courses` |
| `/courses/:courseId` | `/courses/:courseId` |
| `/students` | `/students` |
| `/students/:userId` | `/students/profile/:userId` |
| `/supervision/requests` | `/doctor-dashboard?section=requests` |
| `/supervision/projects` | `/doctor-dashboard?section=projects` |
| `/supervision/cancellations` | `/doctor-dashboard?section=requests` (filter) |
| `/supervision/browse` | TBD — `GET /api/graduation-projects` |
| `/notifications` | `/doctor/notifications` + header bell |
| `/profile` | `/doctor/profile`, `/doctor/edit-profile` |

---

## Implementation phases (priority order)

### Phase 1 — Layouts & navigation ✅ (initial)
- [x] Migration report (this file)
- [x] `components/doctor/hub/DoctorHubAppSidebar.tsx`
- [x] `components/doctor/hub/DoctorHubTopbar.tsx`
- [x] `components/doctor/hub/DoctorHubPageHeader.tsx`, `DoctorHubEmptyState.tsx`
- [x] `pages/doctor/hub/doctor-hub-theme.css`
- [x] Refactor `DoctorDashboardLayout.tsx` to shadcn sidebar shell
- [x] Sync `?section=` query param in `DoctorDashboardPage.tsx`

### Phase 2 — Dashboard 🔄 (partial)
- [x] `OverviewSection` header + stat cards (Lovable `Dashboard.tsx` pattern)
- [x] `StatCard` → shadcn `Card` with optional deep links
- [x] Overview supervision preview + supervised teams sidebar + activity (Phase 8)

### Phase 3 — Courses ✅
- [x] `DoctorCoursesSection` — Lovable card grid, dialog quick-create, `DoctorHubPageHeader`
- [x] `CreateCoursePage` — shadcn form + shared/cross-section checkboxes (API unchanged)
- [x] `DoctorCourseCard` — reusable course card component
- [x] `DoctorSubpageLayout` — lightweight chrome for `/courses/create`
- [x] `DoctorCoursesPage` — unchanged redirect to dashboard courses section
- [ ] `DoctorCourseManagePanel` — still legacy styles (functional; Phase 4+)

### Phase 4 — Sections ✅
- [x] `CourseWorkspacePage` — `DoctorSubpageLayout` (wide), `DoctorHubPageHeader`, shadcn `Tabs`, `?tab=` sync
- [x] `CourseWorkspaceSectionsPanel` — Lovable sections grid + create dialog
- [x] `CreateSectionForm` — shadcn fields (name, days, times, capacity); validation unchanged
- [x] `SectionStudentsPage` — hub layout, roster list, manual/upload tabs
- [x] `DoctorSubpageLayout` — `wide` prop for workspace width
- [x] Projects tab inside `CourseWorkspacePage` — `CourseWorkspaceProjectsPanel` (Phase 6)
- [ ] Settings tab inside `CourseWorkspacePage` — still legacy inline styles (Phase 6+)

### Phase 5 — Students
- [x] `StudentsPage`, `StudentProfilePage`
- [x] `StudentDirectoryCard.tsx` (shared Lovable-style directory card)

### Phase 6 — Course projects
- [x] `CourseWorkspaceProjectsPanel` — Lovable project cards grid (`CourseWorkspace.tsx` ProjectsTab)
- [x] `CourseProjectCreatePage` — `DoctorSubpageLayout` + shadcn form (same APIs/validation)
- [x] `courseProjectUtils.ts` — shared `parseBackendCourseId`, section labels
- [ ] `DoctorCourseManagePanel` projects tab — still legacy (modal CRUD uses real APIs)

### Phase 7 — Teams
- [x] `ProjectTeamsPage` — `DoctorSubpageLayout`, Lovable team cards, regenerate, team chat
- [x] `TeamManagementPage` — real APIs (add/remove by university ID), shadcn dialog/sheet patterns
- [x] `ProjectTeamCard.tsx`, `doctorCoursesApi` team member helpers
- [x] `App.tsx` — legacy `/doctor/projects/:id/teams` redirects when `courseId` in state
- [ ] `DoctorCourseManagePanel` teams tab — still legacy inline UI

### Phase 8 — Supervision
- [x] `RequestsSection` — Lovable inbox cards; supervision + cancellation; accept/reject (`supervisorApi`)
- [x] `ProjectsSection` — Lovable supervised project grid; end supervision confirm (`doctorDashboardApi`)
- [x] `OverviewSection` — supervision widgets, pending banner, preview accept/reject
- [x] `RecentActivitySection`, `SectionSpinner`, `MemberAvatarStack.tsx`
- [ ] Optional browse page (`BrowseGraduationProjects`) — not in SkillSwap today
- [ ] `DeletedProjectsSection` — client-only archive; still legacy CSS

### Phase 9 — Notifications
- [x] `DoctorNotificationsPage` at `/doctor/notifications` (hub shell + filter groups)
- [x] Read/unread via `markGraduationNotificationRead`, `markAllDoctorInboxNotificationsRead`, per-group mark
- [x] Empty/loading states; bell “View all” + doctor row navigation
- [ ] Optional: reskin bell dropdown to shadcn (still inline styles)

### Phase 10 — Profile
- [x] `DoctorProfilePage` (hub shell for `/doctor/profile`; public `/doctors/:id` preserved)
- [x] `EditDoctorProfilePage` (shadcn + existing zod/RHF + `PUT /profile/doctor`)
- [x] Skills, research interests, academic/contact sections via `DoctorProfileView`

### Phase 11 — Shared doctor shell on standalone routes
- [x] `DoctorHubShellLayoutRoute` parent route — sidebar + topbar + `Outlet` for doctor-only paths
- [x] `DoctorAdaptiveShell` on `/students` and `/students/profile/:userId` when `role=doctor`
- [x] `DoctorHubContent` in-page back/width (replaces standalone `DoctorSubpageLayout` chrome)
- [x] Active section highlights `courses` on `/courses/*`

---

## Files to keep (no deletion in phase 1)

- All `frontend/src/api/*` doctor-related modules
- `DoctorContext.tsx`, `doctorDashboardTypes.ts`, `doctorRequestUtils.ts`
- `DoctorDashboardPage.tsx` and all `dashboard/*Section.tsx`
- `App.tsx` doctor route guards
- `GradProjectNotificationBell.tsx`

## Files to remove (later, after parity)

- Redundant `dashboard/Sidebar.tsx` / `Header.tsx` once hub components are stable
- Unused `doctor-dashboard.css` rules superseded by Tailwind (incremental prune only)

---

## Backend integrations affected

**None** by UI-only migration if rules are followed. Every phase must continue calling:

| Domain | API module | Endpoints |
|--------|------------|-----------|
| Auth/session | `axiosInstance`, localStorage | JWT on all protected routes |
| Me / profile | `api.get('/me')`, profile pages | `GET /api/me`, `PUT /api/profile/doctor` |
| Dashboard stats | `doctorDashboardApi` | `GET /api/doctors/me/dashboard-summary` |
| Supervision | `supervisorApi`, `doctorDashboardApi` | requests, accept/reject, cancel, resign |
| Courses | `doctorCoursesApi` | `/api/courses/*` |
| Students | `axiosInstance` | `GET /api/students`, `GET /api/students/{userId}` |
| Notifications | `notificationsApi` | `/api/notifications*` |
| Search | — | `GET /api/search` (topbar, optional) |

---

## Risk register

1. **Mock leakage:** Developers copy Lovable `services.ts` calls — mitigated by report + code review.
2. **Route drift:** Changing `/doctor-dashboard` to Lovable `/` — mitigated by explicit route table above.
3. **Dual styling:** `doctor-dashboard.css` vs Tailwind — migrate section-by-section; scope Lovable tokens under `.doctor-hub`.
4. **Students page:** Shared with student invite flow — doctor restyle must not break `projectId` query behavior.
5. **Course pages without shell:** After dashboard migration, course routes still use old chrome until phase 11.

---

*Last updated: migration kickoff — phase 1 layout implementation follows this report.*
