# Lovable → SkillSwap Student UI Migration Map

Source of truth: `skillswap-connect-41-main` (Lovable archive).  
Target: `frontend/` with **existing routes and APIs unchanged**.

## Layout shell

| Current | Lovable | Notes |
|---------|---------|-------|
| Inline nav in `DashboardPage` | `AppLayout` + `AppSidebar` + `Topbar` | → `student-layout/StudentAppLayout` |
| Inline global search | `GlobalSearch` (CommandDialog) | Wired to `GET /search` |
| — | `Logo` | `shared/Logo` |

## Pages (route preserved)

| Route | Current | Lovable | Data source (keep) |
|-------|---------|---------|-------------------|
| `/dashboard` | `DashboardPage` (monolith) | `Dashboard.tsx` | `getDashboardSummary`, `/me`, invitations, grad project APIs |
| `/profile` | `ProfilePage` | `Profile.tsx` → `StudentMyProfileView` | `/me`, profile APIs — **me mode migrated** |
| `/edit-profile` | `EditProfilePage` | `EditProfile.tsx` | `PUT /profile` — **Lovable shell migrated** |
| `/students` | `StudentsPage` | `Students.tsx` | `/students`, filters, `sendInvitation` |
| `/students/:studentId` | `ProfilePage` (public) | `StudentProfile.tsx` | Student profile API |
| `/doctors` | `DoctorsPage` | `Doctors.tsx` | Doctors list API |
| `/doctors/:doctorId` | `DoctorProfilePage` | `DoctorProfile.tsx` | Doctor profile API |
| `/student/courses` | `StudentCoursesPage` | `Courses.tsx` | `studentCoursesApi` — **hub shell + sidebar migrated** |
| `/student/courses/:courseId` | (in StudentCoursesPage) | `CourseDetail.tsx` | Course detail APIs — **detail panel still inline styles (tabs/projects)** |
| `/student/courses/.../team-choice` | `StudentTeamGenerationChoicePage` | `CourseProject.tsx` | **migrated** |
| `/student/courses/.../manual-team` | `StudentManualTeamPage` | — | **migrated** |
| `/student/courses/.../ai-team` | `StudentAiTeamPage` | — | **migrated** |
| `/student/courses/.../team` | `StudentTeamPage` | — | **migrated** |
| `/student/graduation-project` | `StudentGraduationProjectPage` | `GraduationProjectDetail.tsx` + `CreateGraduationProject.tsx` | **Dedicated workspace** + Lovable create/edit dialog. Sidebar **Graduation Project** links here. |
| `/dashboard` | `StudentDashboardView` | `Dashboard.tsx` | Overview only; **Open workspace** → `/student/graduation-project`; create CTA → `?create=1` |
| `/student/team-invitations` | `StudentTeamInvitationsPage` | `Invitations.tsx` | GP + course tabs — **migrated** |
| `/doctors` | `DoctorsPage` | `Doctors.tsx` | `GET /doctors` — **migrated** |
| `/messages` | `ChatPage` | `Messages.tsx` | SignalR + chat APIs — **migrated** |
| `/organizations` | `StudentOrganizationsPage` | `Organizations.tsx` | Organization APIs — **PageHeader shell; cards still hub styles** |
| `/communities` | `CommunitiesHubPage` | — | Keep; add sidebar link |
| `/following` | `StudentFollowingOrganizationsPage` | — | Keep |

Routes **not** added (functionality stays on dashboard): `/graduation-projects/*` (Lovable-only paths map to `/dashboard`).

## Shared components

| Current | Lovable |
|---------|---------|
| — | `EmptyState` |
| — | `PageHeader` |
| — | `Skeleton` / `PageSkeleton` |
| Inline skill chips | `Badge` + `surface-card` utilities |

## UI primitives

Existing `app/components/ui/*` (shadcn) — align tokens via `styles/theme.css` (Lovable HSL palette).
