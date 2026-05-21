# Student Role Capability Map

Backend audit for the **Student** role only. Based on controllers, models, DTOs, and authorization in `backend/GraduationProject.API`. No invented features.

**JWT role claim:** `"student"`

---

## ID mapping (critical for UI)

| Concept | API field | Database entity |
|--------|-----------|-----------------|
| Auth / profile URLs / private chat | `userId` | `Users.Id` |
| Graduation invites, members, course teammate requests | `profileId`, `studentId`, `receiverId` | `StudentProfiles.Id` |
| Supervisor request target | `doctorId` in `POST .../request-supervisor/{doctorId}` | `DoctorProfiles.Id` |
| Doctor public profile URL | `GET /api/doctors/{doctorId}` | **User.Id** (not DoctorProfile.Id) |

---

## Route aliases & legacy names

| Prefer | Avoid / alias |
|--------|----------------|
| `/api/graduation-projects` | `/api/student-projects` (same controller) |
| `PUT /api/profile` | `PUT /api/students/{userId}` (both work; latter enforces student + self) |
| `roles`, `technicalSkills` | `generalSkills`, `majorSkills` (compatibility aliases in responses) |

---

## 0. Authentication & session

**Backend source:** `AuthController`, `MeController`, `StudentRegisterService`, JWT in `Program.cs`

### Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/register/student` | Public | Register |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/google` | Public | Google sign-in |
| POST | `/api/auth/forgot-password` | Public | Request reset |
| POST | `/api/auth/reset-password` | Public | Reset password |
| GET | `/api/me` | Authorized | Current user profile |

### Data shown

**Login / register response:** `token`, `role`, `userId`, `name`, `email`, `profileId` (and register extras: `university`, `faculty`, `major`, `academicYear`, `skills`).

**`GET /api/me` (student):** `role`, `userId`, `profileId`, `name`, `email`, `studentId`, `university`, `faculty`, `major`, `academicYear`, `gpa`, `bio`, `availability`, `lookingFor`, `github`, `linkedin`, `portfolio`, `profilePictureBase64`, `languages`, `roles`, `technicalSkills`, `tools`, `generalSkills`, `majorSkills`.

**Registration rules:** Academic year must be one of: `First Year`, `Second Year`, `Third Year`, `Fourth Year`, `Fifth Year`.

### Allowed actions

- Register, login, Google sign-in (new users need `role: "student"` in body)
- Password reset flow
- Load session via `GET /api/me`

### Not supported

- Change email or password via profile APIs (reset flow only)
- Refresh-token endpoint (not found in backend)
- Edit academic fields after registration via profile update

### UI states

- Registration validation / duplicate email `409`
- Login `401`
- Google `404` with `code: REGISTRATION_REQUIRED`
- `GET /api/me` `404` if student profile missing

---

## 1. Dashboard

**Backend source:** `DashboardController` — `[Authorize]`; student logic when role ≠ `doctor`.

### Endpoints

| Method | Route |
|--------|-------|
| GET | `/api/dashboard/summary` |
| GET | `/api/dashboard/teammates` |
| GET | `/api/dashboard/profile-strength` |
| GET | `/api/dashboard/my-project` |

### Data shown

**`DashboardSummaryDto`:** `name`, `major`, `university`, `academicYear`, `totalSkills`, `profileStrength` (`score`, `hasProfilePicture`, `hasGeneralSkills`, `hasMajorSkills`, `hasBio`, `hasGpa`), `suggestedTeammates[]` (`userId`, `profileId`, `name`, `major`, `university`, `academicYear`, `profilePicture`, `skills[]`, `matchScore`), `myProject` (`projectId`, `projectName`, `role`, `memberCount`, `maxTeamSize`, `isFull`), `suggestedTeammatesCount`, `matchedGraduationProjectsCount`, `bestTeammateMatchPercent`, `pendingTeamInvitationsCount`.

**`myProject.role`:** `owner` | `member` | null (via summary; detail also on `/api/dashboard/my-project`).

### Allowed actions

- View only (no dashboard mutations)

### Not supported

- Dashboard preferences, dismiss suggestions, CRUD on dashboard

### UI states

- Empty: no `myProject`, zero teammates
- Error: `404` student profile, `401` invalid token

---

## 2. Profile

**Backend source:** `MeController`, `StudentsController`, `ProfileController`, `SearchController`

### Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/me` | Authorized | Own profile |
| GET | `/api/students/{userId}` | AllowAnonymous | Public student profile |
| PUT | `/api/students/{userId}` | Student, self | Update profile |
| PUT | `/api/profile` | Authorized | Update profile (by token userId) |
| GET | `/api/students` | Authorized | Browse peers |
| GET | `/api/students/filters` | Authorized | Filter options |
| GET | `/api/students/followed-organizations` | `Roles = student` | Followed orgs (simple list) |
| GET | `/api/students/following-organizations` | `Roles = student` | Followed orgs (discovery DTO) |
| GET | `/api/search?query=` | Authorized | Quick search (5 students, 5 doctors) |

**`GET /api/students` query params:** `skill`, `university`, `major`, `search`, `availableOnly` (excludes students who own or belong to any graduation project).

**Peer list item:** `userId`, `profileId`, `name`, `university`, `major`, `academicYear`, `skills[]`, `matchScore`, `profilePicture`.

### Updatable fields (PUT)

`fullName`, `bio`, `availability`, `lookingFor`, `github`, `linkedin`, `portfolio`, `profilePictureBase64`, `languages`, `roles`, `technicalSkills`, `tools` (or `generalSkills` / `majorSkills`).

### Not supported

- Update: `university`, `faculty`, `major`, `academicYear`, `gpa`, `studentId`, `email`, password
- Dedicated `/api/skills` catalog (use `GET /api/students/filters` or skill names at register)

### UI states

- Empty search results
- `403` editing another user's profile
- Anonymous view: no `matchScore` on others' profiles

---

## 3. Graduation project

**Backend source:** `StudentProjectController`, `InvitationsController`, `AiController`, `DoctorsController`

### Discovery & own project

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/graduation-projects` | All projects; optional `studentId`, `doctorId` filters |
| GET | `/api/graduation-projects/my` | `{ role, project }` or empty |
| GET | `/api/graduation-projects/{id}` | Detail |
| GET | `/api/graduation-projects/{id}/members` | Roster + `isOwner`, `isLeader`, capacity |

**`StudentProjectResponseDto`:** `id`, `ownerId`, `ownerUserId`, `ownerName`, `name`, `abstract`, `projectType`, `requiredSkills[]`, `partnersCount`, `currentMembers`, `isFull`, `isOwner`, `remainingSeats`, `supervisor`, `members[]`, `createdAt`, `updatedAt`.

**`projectType`:** `GP1` | `GP2` | `GP` (Engineering & IT may choose; others forced to `GP` on create).

**Capacity:** `partnersCount` = total team size including leader; `isFull` when `currentMembers >= partnersCount`.

### Create / update / delete (owner only)

| Method | Route | Rules |
|--------|-------|-------|
| POST | `/api/graduation-projects` | One project per student (owner or member elsewhere → `409`); owner auto `leader` |
| PUT | `/api/graduation-projects/{id}` | Owner only |
| DELETE | `/api/graduation-projects/{id}` | Owner only |

### Membership

| Method | Route | Who | Rules |
|--------|-------|-----|-------|
| POST | `/api/graduation-projects/{id}/join` | Student | Not owner; not member; not full; no other project |
| DELETE | `/api/graduation-projects/{id}/leave` | Member | Not `leader` |
| DELETE | `/api/graduation-projects/{id}/members/{memberId}` | Leader | `memberId` = StudentProfile.Id |
| PUT | `/api/graduation-projects/{id}/change-leader/{memberId}` | Leader | Transfer leadership |

**Internal member roles:** `leader`, `member` (API exposes `role`; comments say not for UI role badges).

### Teammate discovery (owner)

| Method | Route |
|--------|-------|
| GET | `/api/graduation-projects/{projectId}/available-students` |
| GET | `/api/graduation-projects/{projectId}/recommended-students` |
| POST | `/api/graduation-projects/{projectId}/invite/{receiverId}` |

**`ProjectAvailableStudentDto` flags:** `isMember`, `hasPendingInvite`, `isOwner`, `ownsGraduationProject`, `isProjectFull`, `canInvite`, `matchScore`.

**Invite rules:** Receiver must not own another graduation project; project not full; no duplicate `pending` invite.

### AI (graduation)

| Method | Route | Who | Body | Response |
|--------|-------|-----|------|----------|
| POST | `/api/ai/recommend-students` | Owner or leader | `{ projectId }` | `studentId`, `matchScore`, `reason`, `name`, `major`, `university`, `skills[]` |
| POST | `/api/ai/recommend-supervisors` | Owner or leader | `{ projectId }` | `doctorId`, `matchScore`, `reason` |
| GET | `/api/graduation-projects/{projectId}/recommended-supervisors` | Leader only | — | Rule-based `RecommendedSupervisorDto[]` |

Falls back to rule-based scoring if OpenAI unavailable.

### Supervisor (student actions)

| Method | Route | Who | Rules |
|--------|-------|-----|-------|
| POST | `/api/graduation-projects/{projectId}/request-supervisor/{doctorId}` | Leader | `doctorId` = DoctorProfiles.Id; no supervisor yet; no duplicate `pending` |
| POST | `/api/graduation-projects/{projectId}/request-supervisor-cancel` | Leader | Project must have supervisor |

**SupervisorRequest status:** `pending` | `accepted` | `rejected`

**SupervisorCancellationRequest status:** `pending` | `accepted` | `rejected`

**Not supported for students:** List outgoing supervisor requests (no GET); accept/reject requests (doctor only).

### Doctors (read + request target)

| Method | Route |
|--------|-------|
| GET | `/api/doctors?search=` |
| GET | `/api/doctors/{doctorId}` | `doctorId` = **User.Id** |

### Not supported

- Graduation project group chat API
- Student accept/reject supervisor requests
- `GET /api/doctors/me/*` (doctor dashboard)

### UI states

- No project: CTA create
- `409` already in another project
- `403` non-owner/non-leader actions
- Join disabled when `isFull` or already affiliated

---

## 4. Teams

### Graduation teams

See §3. No team chat endpoint for graduation projects.

### Course teams

**Backend source:** `CoursesController`, `TeamChatController`, `SectionsController`

#### Enrollment (read-only)

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/courses/enrolled` | `Roles = student` |
| GET | `/api/courses/{courseId}` | `doctor,student` (student must be enrolled) |
| GET | `/api/courses/{courseId}/students` | `Roles = student` |
| GET | `/api/courses/{courseId}/projects` | `doctor,student` |

**Course project (student view):** `id`, `courseId`, `title`, `description`, `teamSize`, `applyToAllSections`, `allowCrossSectionTeams`, `aiMode`, `sections[]`, `hasTeam`, `createdAt`.

#### Team modes

| `aiMode` | Student backend behavior |
|----------|--------------------------|
| `"student"` | Manual team: browse, AI recommendations, send/accept/reject invitations |
| `"doctor"` | Doctor generates teams; student only sees assigned team via `my-team` |

#### Manual team (`aiMode: student`)

| Method | Route |
|--------|-------|
| GET | `/api/courses/{courseId}/projects/{projectId}/manual-team/students` |
| GET | `/api/courses/{courseId}/projects/{projectId}/ai-team-recommendations` |
| POST | `/api/courses/{courseId}/projects/{projectId}/manual-team/requests/{receiverId}` |
| GET | `/api/courses/team-invitations` |
| POST | `/api/courses/team-invitations/{invitationId}/accept` |
| POST | `/api/courses/team-invitations/{invitationId}/reject` |

**`availabilityStatus`:** `available` | `pending` | `already_teammate` | `unavailable`

**Course invite:** Stored as `UserNotification` with `eventType: course_teammate_invitation_pending` and dedup key `course:invite:{projectId}:{senderProfileId}:{receiverProfileId}`. **`invitationId` = notification `id`.**

#### Assigned team (both modes)

| Method | Route |
|--------|-------|
| GET | `/api/courses/projects/{projectId}/my-team` |

**Response:** `projectId`, `projectTitle`, `courseId`, `teamId`, `teamIndex`, `members[]` (`studentId`, `userId`, `name`, `universityId`, `matchScore`).

#### Course team chat

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/teams/{teamId}/chat` | `Roles = student`, team member |
| POST | `/api/teams/{teamId}/chat` | `Roles = student`, team member |

#### Section chat

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/sections/{sectionId}/chat` | `Roles = student`, enrolled |
| POST | `/api/sections/{sectionId}/chat` | `Roles = student`, enrolled |

### Not supported (students)

- Create/edit/delete courses, sections, course projects
- Self-enrollment in sections (doctor adds students)
- `POST .../generate-teams` (doctor only, `aiMode: doctor`)
- `GET .../teams` list all teams (doctor only)
- Doctor edit team membership
- Cancel a sent course team invitation (no endpoint)
- `POST /api/course-teams/{teamId}/conversation` (doctor creates; students may participate if already in conversation)

### UI states

- Not enrolled → course `404`
- No team → `my-team` `404`
- Show `availabilityReason` when not `available`
- Pending invite blocks re-invite

---

## 5. Courses / course projects

Consolidated in §4.

**Enrollment:** Doctor-only via `POST /api/courses/sections/{sectionId}/students`. Students cannot self-enroll.

**Not implemented in backend:** Student selects section at enrollment (assigned by doctor).

---

## 6. Invitations

### Graduation (`ProjectInvitation`)

**Backend source:** `InvitationsController`

| Status | Meaning |
|--------|---------|
| `pending` | Actionable |
| `accepted` | Joined team |
| `rejected` | Declined |
| `cancelled` | Owner cancelled |
| `expired` | Superseded when another invite accepted |

| Method | Route | Role |
|--------|-------|------|
| GET | `/api/invitations/received` | Receiver |
| GET | `/api/invitations/sent/{projectId}` | Owner |
| POST | `/api/invitations/{id}/accept` | Receiver |
| POST | `/api/invitations/{id}/reject` | Receiver |
| POST | `/api/invitations/{id}/cancel` | Sender (owner) |

**Accept:** Adds member; other pending invites to same student → `expired`.

### Course team

Via notifications (see §4). No separate `ProjectInvitations` table for course.

### Not supported

- Course invite cancel by sender
- Student-initiated graduation invite except accept/reject received

### UI states

- `400` if invitation already processed or project full
- `403` if not receiver/owner

---

## 7. Notifications

**Backend source:** `NotificationsController`, `GraduationProjectNotificationService`, SignalR `NotificationsHub` (`/hubs`, pass JWT as `access_token` query param)

| Method | Route |
|--------|-------|
| GET | `/api/notifications?take=&category=` |
| GET | `/api/notifications/unread-count?category=` |
| POST | `/api/notifications/{id}/read` |
| POST | `/api/notifications/read-all?category=` |
| POST | `/api/notifications/read-scope?scope=&category=chat` |

**Default category:** `graduation_project`

**Categories students use:** `graduation_project`, `course`, `chat`, `organization_event`, `organization_recruitment`

**Row fields:** `id`, `category`, `title`, `body`, `eventType`, `projectId`, `createdAt`, `readAt`

**Sample graduation `eventType` values:** `project_created`, `project_updated`, `project_deleted`, `member_joined`, `member_left`, `member_removed_self`, `member_removed_team`, `leader_changed_new`, `leader_changed_old`, `leader_changed_members`, `invitation_received`, `invitation_rejected`, `invitation_cancelled_by_sender`, `invitation_expired_after_acceptance`, `supervision_request_received`, `supervision_request_accepted`, `supervision_request_rejected`, `supervision_request_auto_rejected`, `supervisor_cancellation_requested`, `supervisor_cancellation_accepted`, `supervisor_cancellation_rejected`, `supervision_cancelled_by_doctor`

**Sample course `eventType` values:** `course_project_created`, `course_project_updated`, `course_project_deleted`, `course_teams_generated`, `course_team_member_added_self`, `course_team_member_added_team`, `course_team_member_moved`, `course_team_member_removed_self`, `course_team_member_removed_team`, `course_section_enrollment_added`, `course_teammate_invitation_pending`, `course_teammate_invitation_accepted`, `course_teammate_invitation_rejected`

**Chat read-scope examples:** `section:{sectionId}`, `team:{teamId}` (prefix `chat:{scope}:` in dedup keys)

### Allowed actions

- List, unread count, mark one read, mark all in category, mark chat scope read

### Not supported

- Delete notifications
- Student notification preferences

### UI states

- Empty per category
- Navigate by `eventType` + `projectId` + `category` only (no fake action buttons)

---

## 8. Chat / conversations

**Backend source:** `ConversationsController`, `MessagesController`, `ConversationService`

| Method | Route | Action |
|--------|-------|--------|
| GET | `/api/conversations` | Inbox |
| GET | `/api/conversations/{id}` | Thread (`page`, `pageSize` max 100) |
| POST | `/api/conversations/start/{targetUserId}` | Start DM (any valid user) |
| DELETE | `/api/conversations/{id}` | Delete for participant |
| POST | `/api/messages` | Send (`conversationId`, `text` ≤ 2000) |
| PUT | `/api/messages/{id}` | Edit own |
| DELETE | `/api/messages/{id}` | Unsend own |
| POST | `/api/messages/{conversationId}/seen` | Mark seen |

**`ConversationListItemDto`:** `id`, `title`, `courseTeamId`, `users[]`, `participantCount`, `otherUser`, `lastMessage`, `unseenCount`

**`MessageDto`:** `id`, `senderId`, `text`, `createdAt`, `edited`, `deleted`, `seen`

### Allowed

- 1:1 chat with students or doctors
- Multi-user threads if doctor created course-team conversation (students are participants)

### Not supported

- Student creates doctor–team conversation
- Graduation project group chat

### UI states

- `Forbid` if not participant
- Empty thread
- Deleted messages: `deleted: true`

---

## 9. Companies / organizations

### Companies

**Not supported for students.** All `/api/company/*` routes require `Roles = company`. No student company invitations, applications, or talent search.

### Student associations (organizations)

**Backend source:** `OrganizationsController`, `StudentOrganizationMembershipsController`, `PublicRecruitmentApplicationsController`

| Feature | Endpoints | Student |
|---------|-----------|---------|
| Discover | `GET /api/organizations/public`, `GET /api/organizations`, `GET /api/organizations/{id}` | View |
| Follow | `GET .../follow-status`, `POST .../follow`, `DELETE .../follow` | `Roles = student` |
| Following | `GET /api/students/followed-organizations`, `following-organizations` | View |
| Campaigns | `GET .../recruitment-campaigns`, `GET .../recruitment-campaigns/{id}` | Published, deadline ≥ now |
| Apply | `POST .../positions/{positionId}/applications` | One per position |
| My application | `GET .../positions/{positionId}/applications/mine` | Status |
| Upload | `POST .../application-uploads` | 8MB; png, jpg, jpeg, webp, pdf, doc, docx |
| Memberships | `GET /api/student/organization-memberships` | After acceptance |
| Events | `GET .../events/{eventId}` | Detail + registration form **fields** (read-only) |

**Recruitment statuses:** `Pending`, `AiSuggested`, `Accepted`, `Rejected` (organization updates; student cannot PATCH).

**Membership kinds:** `Leadership`, `Member`

### Not implemented in backend

- Student **submit event registration** (form visible only; no submit endpoint)
- Withdraw recruitment application
- Student organization admin / review applications
- Association “invitation” accept flow (membership via accepted recruitment)

### UI states

- Application `409` duplicate
- Campaign not found when unpublished or past deadline
- Follow own org `400`

---

# Lovable Design Requirements

Build the **Student** experience for SkillSwap. Design **only** features supported by the existing .NET API.

## Global rules

- Role: `student`. Auth: JWT from login/register; store `userId`, `profileId`, `token`.
- Use correct IDs: `userId` for profiles and chat; `StudentProfile.Id` for graduation invites and course `receiverId`.
- **Do not add:** company talent flows, student self-course-enrollment, event registration submit, supervisor accept/reject UI, doctor team generation UI, post-signup edit of university/major/GPA, graduation project group chat, cancel course team invite, delete notifications.
- API paths: prefer `/api/graduation-projects`. Map `generalSkills` → `roles`, `majorSkills` → `technicalSkills`.

## Screens to design

1. **Auth** — Register (account, academic info, skills), login, forgot/reset password, Google (`role: student` for new users).
2. **Dashboard** — `GET /api/dashboard/summary`: profile strength, suggested teammates (≤6), project card or empty CTA, stat counts. Links only to real flows.
3. **Profile (self)** — `GET /api/me`; edit `PUT /api/profile`; read-only academic block; profile strength widget.
4. **Browse students** — List, filters, `availableOnly`, peer profile, start conversation.
5. **Graduation project hub** — `GET /api/graduation-projects/my`; owner vs member vs empty; discover list; join when allowed; owner: edit, delete, members, invites, AI, supervisor request (leader), change leader, remove member; member: leave (non-leader).
6. **Graduation invitations** — Received (accept/reject when `pending`); owner sent list (cancel when `pending`).
7. **Courses** — Enrolled list; course detail; projects with `aiMode` and `hasTeam`; student mode: manual team + AI + invitations; doctor mode: wait then `my-team` + team chat; section chat.
8. **Messages** — Conversations inbox, thread, send/edit/unsend, seen; support multi-participant / `courseTeamId` threads.
9. **Notifications** — Filter by category; unread badge; mark read; navigation from `eventType` / `projectId` (no unsupported actions).
10. **Organizations** — Directory, detail, follow, campaigns, apply + file upload, my application status, memberships.
11. **Doctors** — Search and profile (`userId` in URL); from leader view use `doctorId` (DoctorProfile.Id) for supervision request.

## Required UX states

- Loading skeletons on all GETs.
- Empty: no project, no team, no invites, no courses, no notifications, no chats.
- Errors: show backend `message` for `400`, `401`, `403`, `404`, `409`.
- Disable actions when API flags forbid: `canInvite === false`, `isFull`, `hasPendingInvite`, `ownsGraduationProject`, course `availabilityStatus !== 'available'`.

## Status chips (use verbatim)

- Graduation invitations: `pending`, `accepted`, `rejected`, `cancelled`, `expired`
- Recruitment: `Pending`, `Accepted`, `Rejected`, `AiSuggested`
- Course teammate: `available`, `pending`, `already_teammate`, `unavailable`
- Graduation affiliation: `owner`, `member`, or none
- Project type: `GP1`, `GP2`, `GP`

---

*Generated from backend audit. Last updated: May 2026.*
