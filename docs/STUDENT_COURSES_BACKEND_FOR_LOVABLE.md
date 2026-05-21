# Student Courses — Backend Contract for Frontend (Lovable)

This document describes **only what exists in the backend today** for the student **My Courses** experience (`/student/courses` and related routes). Use it as the source of truth when building UI against the API.

**Base URL:** `/api`  
**Auth:** `Authorization: Bearer <JWT>`  
**Role:** `student` (unless noted)

Related audit: `docs/STUDENT_CAPABILITY_MAP.md` §4 (Course teams) and §5.

---

## ID mapping (critical)

| Concept | API field | Database |
|--------|-----------|----------|
| Auth / profile URLs / private chat | `userId` | `Users.Id` |
| Course teammate invites, roster `studentId`, `receiverId` | `profileId`, `studentId`, `receiverId` | `StudentProfiles.Id` |
| Doctor on course cards (`doctorId` in course responses) | `doctorId` | `DoctorProfiles.Id` |
| Public doctor profile `GET /api/doctors/{doctorId}` | path param | **`Users.Id`** (not DoctorProfile.Id) |

**Implication:** Linking from a course card to `/doctors/{id}` may require resolving `DoctorProfile` → `UserId` unless the UI uses another endpoint.

---

## Student UI flows (routes)

| Frontend route | Backend used |
|----------------|--------------|
| `/student/courses` | enrolled list + course detail + section tab |
| `/student/courses/:courseId` | same + tabs (`?tab=section\|chat\|projects`) |
| `.../team-choice` | project metadata from list / navigation state |
| `.../manual-team` | manual-team students + send request |
| `.../ai-team` | ai-team-recommendations + send request (same POST as manual) |
| `.../team` | my-team + team chat |
| `/student/team-invitations` | team-invitations accept/reject |

---

## Endpoints (student)

### Session

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/me` | Authorized | Current user; includes `profileId` / `studentProfileId` for matching roster |

### Course enrollment & detail

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/courses/enrolled` | `Roles = student` | Sidebar: all courses the student is enrolled in |
| GET | `/courses/{courseId}` | `doctor,student` | Course header, sections, student's section |
| GET | `/courses/{courseId}/students` | `Roles = student` | Full course roster (all sections) |
| GET | `/courses/{courseId}/projects` | `doctor,student` | Projects visible to student; includes `hasTeam` |

**Enrollment rule:** Students cannot self-enroll. Doctor adds students via `POST /courses/sections/{sectionId}/students` (doctor only).

### Team formation (`CourseProject.aiMode = "student"`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/courses/{courseId}/projects/{projectId}/manual-team/students` | Browse classmates to invite |
| GET | `/courses/{courseId}/projects/{projectId}/ai-team-recommendations` | AI-ranked list (same invite flow) |
| POST | `/courses/{courseId}/projects/{projectId}/manual-team/requests/{receiverId}` | Send teammate invitation |
| GET | `/courses/team-invitations` | Pending invitations received |
| POST | `/courses/team-invitations/{invitationId}/accept` | Accept → creates/joins `CourseTeam` |
| POST | `/courses/team-invitations/{invitationId}/reject` | Reject |

**Invitation storage:** Not a separate `invitations` table. Pending invites are `UserNotification` rows:

- `category`: `"course"`
- `eventType`: `"course_teammate_invitation_pending"`
- `dedupKey`: `course:invite:{projectId}:{senderProfileId}:{receiverProfileId}`
- **`invitationId` in API = `UserNotification.id`**

### Assigned team (both `aiMode` values)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/courses/projects/{projectId}/my-team` | Current team for project |
| GET | `/teams/{teamId}/chat?limit=100` | Team chat history |
| POST | `/teams/{teamId}/chat` | Send team message |

### Section chat

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/sections/{sectionId}/chat?limit=100` | Section chat (student must be enrolled in section) |
| POST | `/sections/{sectionId}/chat` | Send section message |

**Chat read scopes (notifications):** `section:{sectionId}`, `team:{teamId}`

### Doctor ↔ team messaging (read-only for student)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/conversations` | Authorized | List conversations; find row with `courseTeamId === teamId` |
| — | Navigate to `/messages` with `conversationId` | — | Student does **not** create team↔doctor chat |

Doctor creates: `POST /api/course-teams/{teamId}/conversation` (`Roles = doctor` only).

### Dashboard (related counts)

| Method | Route | Field |
|--------|-------|-------|
| GET | `/dashboard/summary` | `pendingTeamInvitationsCount` (course teammate notifications) |

---

## Not implemented (do not build UI against these)

The legacy frontend `studentCoursesApi.ts` still references some routes that **do not exist** in the backend:

| Route | Status |
|-------|--------|
| `GET /courses/{id}/student-view` | **Missing** |
| `GET /courses/{id}/project-setting` | **Missing** |
| `GET/POST /courses/{id}/partner-requests` | **Removed** (tables dropped in migration) |
| `POST /courses/{id}/leave` | **Missing** |
| `DELETE /courses/{id}/teams/...` | **Missing** (doctor team management only) |

---

## Doctor-only endpoints (context only)

Students must not call these; listed so Lovable does not invent them:

- `GET /courses/my`, `POST /courses`
- `GET/POST /courses/{courseId}/sections`
- `GET/POST /courses/sections/{sectionId}/students`
- `POST /courses/{courseId}/projects`, `PUT/DELETE /courses/projects/{projectId}`
- `POST /courses/{courseId}/projects/{projectId}/generate-teams`
- `GET /courses/{courseId}/projects/{projectId}/teams` (+ member CRUD)
- `POST /course-teams/{teamId}/conversation`

---

## Response shapes (JSON)

ASP.NET may serialize camelCase depending on configuration; the API often returns **camelCase** in anonymous objects. Support both camelCase and PascalCase defensively in the client if needed.

### `GET /courses/enrolled`

```json
[
  {
    "courseId": 1,
    "name": "Software Engineering",
    "code": "SE401",
    "semester": "Fall 2025",
    "doctorId": 3,
    "doctorName": "Dr. Smith",
    "section": {
      "sectionId": 10,
      "sectionName": "Section A"
    }
  }
]
```

### `GET /courses/{courseId}` (student)

Returns `404` with `{ "message": "Course not found." }` if not enrolled.

```json
{
  "courseId": 1,
  "name": "Software Engineering",
  "code": "SE401",
  "semester": "Fall 2025",
  "createdAt": "2025-04-28T12:00:00Z",
  "doctorId": 3,
  "doctorName": "Dr. Smith",
  "mySectionId": 10,
  "mySectionName": "Section A",
  "sections": [
    {
      "id": 10,
      "name": "Section A",
      "courseId": 1,
      "days": ["mon", "wed"],
      "timeFrom": "09:00",
      "timeTo": "11:00",
      "capacity": 30
    }
  ]
}
```

### `GET /courses/{courseId}/students`

```json
[
  {
    "studentId": 42,
    "name": "Jane Doe",
    "universityId": "2021001",
    "university": "Example University",
    "major": "Computer Science",
    "email": "jane@example.com",
    "enrolledAt": "2025-05-01T08:00:00Z",
    "sectionId": 10
  }
]
```

Note: `studentId` here is **`StudentProfiles.Id`**. For profile links use `userId` if the API adds it; current DTO does not include `userId` on this endpoint — roster UI may need `GET /students/{userId}` from another source or backend extension.

### `GET /courses/{courseId}/projects` (student)

```json
[
  {
    "id": 5,
    "courseId": 1,
    "title": "Final Project",
    "description": "Build a team app",
    "teamSize": 4,
    "applyToAllSections": false,
    "allowCrossSectionTeams": false,
    "aiMode": "student",
    "createdAt": "2025-05-01T10:00:00Z",
    "sections": [
      { "sectionId": 10, "sectionName": "Section A" }
    ],
    "hasTeam": false
  }
]
```

**`aiMode`:**

| Value | Student UX |
|-------|------------|
| `"student"` | Manual browse / AI suggestions → send invitations |
| `"doctor"` | No self-serve team building; doctor runs `generate-teams`; student uses `my-team` when assigned |

Filter projects client-side: show projects where `applyToAllSections === true` OR `sections` contains the student's `mySectionId`.

### `GET .../manual-team/students`

```json
{
  "projectId": 5,
  "projectTitle": "Final Project",
  "teamSize": 4,
  "students": [
    {
      "id": 43,
      "name": "John Smith",
      "email": "john@example.com",
      "skills": ["React", "C#"],
      "sectionName": "Section A",
      "avatar": "<base64 or null>",
      "bio": "…",
      "hasPendingRequest": false,
      "isAlreadyInTeam": false,
      "availabilityStatus": "available",
      "availabilityReason": "Available"
    }
  ]
}
```

**`availabilityStatus`:**

| Status | UI |
|--------|-----|
| `available` | Enable “Send invitation” |
| `pending` | Disabled; invitation already sent |
| `already_teammate` | On sender's team or already in a project team |
| `unavailable` | Disabled; show `availabilityReason` (e.g. cross-section blocked, team full) |

### `POST .../manual-team/requests/{receiverId}`

**Body:** none  
**Success:** `200` `{ "message": "Team request sent successfully." }`  
**Errors:** `400` team full, duplicate invite, etc.

`receiverId` = **`StudentProfiles.Id`**

### `GET .../ai-team-recommendations`

Array (same invite POST as manual):

```json
[
  {
    "studentId": 43,
    "name": "John Smith",
    "email": "john@example.com",
    "avatar": null,
    "sectionName": "Section A",
    "skills": ["React"],
    "bio": "…",
    "matchScore": 87,
    "matchReason": "Strong overlap in required skills",
    "hasPendingRequest": false,
    "isAlreadyInTeam": false,
    "availabilityStatus": "available",
    "availabilityReason": "Available"
  }
]
```

### `GET /courses/team-invitations`

```json
[
  {
    "invitationId": 9001,
    "projectId": 5,
    "projectTitle": "Final Project",
    "courseId": 1,
    "courseName": "Software Engineering",
    "senderId": 42,
    "senderName": "Jane Doe",
    "senderSection": "Section B",
    "senderSkills": ["React", "SQL"],
    "message": "Jane Doe invited you to join their team for \"Final Project\".",
    "invitedAt": "2025-05-10T14:00:00Z"
  }
]
```

### `POST /courses/team-invitations/{invitationId}/accept`

```json
{
  "teamId": 12,
  "courseId": 1,
  "projectId": 5,
  "status": "accepted"
}
```

### `POST /courses/team-invitations/{invitationId}/reject`

```json
{
  "message": "Invitation rejected."
}
```

### `GET /courses/projects/{projectId}/my-team`

**404:** `{ "message": "You are not assigned to a team for this project." }`

```json
{
  "projectId": 5,
  "projectTitle": "Final Project",
  "courseId": 1,
  "teamId": 12,
  "teamIndex": 0,
  "members": [
    {
      "studentId": 42,
      "userId": 101,
      "name": "Jane Doe",
      "universityId": "2021002",
      "matchScore": 0
    }
  ]
}
```

`teamIndex` → display label e.g. `Team A` (`teamIndex` 0 → A).

### Chat messages (section & team)

**Request `POST` body:**

```json
{ "text": "Hello section!" }
```

**Response (section — `ChatMessageResponseDto`):**

```json
{
  "id": 1,
  "sectionId": 10,
  "senderUserId": 101,
  "senderName": "Jane Doe",
  "text": "Hello section!",
  "sentAt": "2025-05-10T15:00:00Z"
}
```

**Response (team — anonymous object):**

```json
{
  "id": 1,
  "teamId": 12,
  "senderUserId": 101,
  "senderName": "Jane Doe",
  "text": "Hello team!",
  "sentAt": "2025-05-10T15:00:00Z"
}
```

**Query:** `limit` default `100`, clamped `1–500`.

---

## Suggested screens (Lovable)

1. **Courses hub** — `GET /courses/enrolled` + master/detail layout  
2. **Course detail** — tabs: Section info + roster, Section chat, Projects  
3. **Project card** — `aiMode`, `hasTeam`, CTA: “Generate team” vs “View my team”  
4. **Team choice** — manual vs AI (navigation only; no extra API)  
5. **Manual / AI picker** — student cards + invite button + availability states  
6. **Team workspace** — members sidebar + team chat + optional doctor conversation link  
7. **Team invitations inbox** — accept/reject  

---

## Backend source files (copy to Lovable)

### Controllers (required)

```
backend/GraduationProject.API/Controllers/CoursesController.cs
backend/GraduationProject.API/Controllers/SectionsController.cs
backend/GraduationProject.API/Controllers/TeamChatController.cs
```

### Supporting controllers

```
backend/GraduationProject.API/Controllers/MeController.cs
backend/GraduationProject.API/Controllers/ConversationsController.cs
backend/GraduationProject.API/Controllers/DashboardController.cs
backend/GraduationProject.API/Controllers/DoctorsController.cs
```

### DTOs

```
backend/GraduationProject.API/DTOs/EnrolledCourseResponseDto.cs
backend/GraduationProject.API/DTOs/CourseDTOs.cs
backend/GraduationProject.API/DTOs/CourseSectionDTOs.cs
backend/GraduationProject.API/DTOs/CourseProjectDTOs.cs
backend/GraduationProject.API/DTOs/SectionStudentDTOs.cs
backend/GraduationProject.API/DTOs/ChatMessageDTOs.cs
```

### Models

```
backend/GraduationProject.API/Models/Course.cs
backend/GraduationProject.API/Models/CourseSection.cs
backend/GraduationProject.API/Models/SectionEnrollment.cs
backend/GraduationProject.API/Models/CourseProject.cs
backend/GraduationProject.API/Models/CourseProjectSection.cs
backend/GraduationProject.API/Models/CourseTeam.cs
backend/GraduationProject.API/Models/CourseTeamMember.cs
backend/GraduationProject.API/Models/CourseTeamMessage.cs
backend/GraduationProject.API/Models/SectionChatMessage.cs
backend/GraduationProject.API/Models/UserNotification.cs
backend/GraduationProject.API/Models/Conversation.cs
```

### Services & data (for behavior details)

```
backend/GraduationProject.API/Services/IAiStudentRecommendationService.cs
backend/GraduationProject.API/Services/OpenAiStudentRecommendationService.cs
backend/GraduationProject.API/Services/IGraduationProjectNotificationService.cs
backend/GraduationProject.API/Services/GraduationProjectNotificationService.cs
backend/GraduationProject.API/Data/ApplicationDbContext.cs
backend/GraduationProject.API/Helpers/AuthorizationHelper.cs
```

### Repositories (optional deep dive)

```
backend/GraduationProject.API/Interfaces/ICourseRepository.cs
backend/GraduationProject.API/Interfaces/ICourseSectionRepository.cs
backend/GraduationProject.API/Interfaces/ICourseProjectRepository.cs
backend/GraduationProject.API/Interfaces/ICourseTeamRepository.cs
backend/GraduationProject.API/Interfaces/ISectionChatRepository.cs
backend/GraduationProject.API/Repositories/CourseRepository.cs
backend/GraduationProject.API/Repositories/CourseSectionRepository.cs
backend/GraduationProject.API/Repositories/CourseProjectRepository.cs
backend/GraduationProject.API/Repositories/CourseTeamRepository.cs
backend/GraduationProject.API/Repositories/SectionChatRepository.cs
backend/GraduationProject.API/Repositories/CourseTeamChatRepository.cs
```

---

## Error patterns

| HTTP | Typical cause |
|------|----------------|
| `401` | Missing/invalid token or missing student profile |
| `403` | Not enrolled in section / not team member |
| `404` | Course not found (not enrolled), project not found, no team |
| `400` | Team full, duplicate invitation, invalid invitation |

Messages are usually `{ "message": "…" }`.

---

## Notifications (course teammate)

Event types used by the backend:

- `course_teammate_invitation_pending`
- `course_teammate_invitation_accepted`
- `course_teammate_invitation_rejected`

Category: `course`. Deep links in the existing app often use `/student/courses` or `/student/team-invitations` with `highlightInvitationId` in navigation state.

---

*Generated from `GraduationProject.API` as of the student courses UI refactor. If controllers change, diff against `CoursesController.cs` first.*
