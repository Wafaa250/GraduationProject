# SkillSwap / Graduation Project Platform — Backend Documentation

> **Scope:** This document describes the system **exclusively from the current backend** (`backend/GraduationProject.API`). It reflects implemented APIs, data models, services, and business rules as they exist in code—not planned frontend behavior.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Vision & Problem Statement](#2-project-vision--problem-statement)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [User Roles & Access Control](#5-user-roles--access-control)
6. [Domain Modules](#6-domain-modules)
7. [Data Model](#7-data-model)
8. [API Reference by Module](#8-api-reference-by-module)
9. [AI-Powered Features](#9-ai-powered-features)
10. [Real-Time Notifications](#10-real-time-notifications)
11. [Messaging & Chat](#11-messaging--chat)
12. [Business Rules & Constraints](#12-business-rules--constraints)
13. [Configuration & Local Setup](#13-configuration--local-setup)
14. [Project Structure](#14-project-structure)

---

## 1. Executive Summary

**SkillSwap** (internal API name; repository folder: `GraduationProject`) is a **university collaboration platform** built as an ASP.NET Core 8 REST API backed by **PostgreSQL**. It connects:

- **Students** — discover peers, form graduation project teams, join course teams, follow student organizations, and communicate.
- **Doctors (faculty)** — supervise graduation projects, manage courses/sections, and auto-generate balanced student teams using AI.
- **Companies** — search student talent using skill-based and AI-assisted matching.
- **Student associations / organizations** — publish events, run recruitment campaigns, manage members, and analyze applicants with AI.

The backend is the **single source of truth** for authentication (JWT), persistence (EF Core), file uploads, OpenAI integrations, and push-style notifications (SignalR).

---

## 2. Project Vision & Problem Statement

### The idea

University students often struggle to:

1. Find teammates whose skills align with a graduation project idea.
2. Request and secure an academic supervisor.
3. Coordinate teams inside coursework (lab/project courses).
4. Discover opportunities from student clubs and companies.

Faculty and organizations lack a unified place to **publish needs**, **review candidates**, and **notify** stakeholders when status changes.

### What the backend solves

| Stakeholder | Pain point | Backend solution |
|-------------|------------|------------------|
| Student | “I have a project idea but no team.” | Graduation project engine: create project, invite/join members, AI teammate recommendations, supervisor requests. |
| Student | “I’m in a course that requires random teams.” | Course module: doctor-defined projects, AI or manual team formation, team chat, private conversations. |
| Doctor | “I need to supervise projects and assign teams.” | Doctor dashboard, supervisor request workflow, course team generation (`AiMode = doctor`). |
| Company | “We need interns/juniors with specific skills.” | Company talent search with persisted requests and OpenAI ranking. |
| Student association | “We recruit members and run events.” | Events, custom registration forms, recruitment campaigns with Q&A and AI applicant analysis. |

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | .NET 8 (`net8.0`) |
| Web framework | ASP.NET Core Web API |
| ORM | Entity Framework Core 8 |
| Database | PostgreSQL (`Npgsql.EntityFrameworkCore.PostgreSQL`) |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) |
| Password hashing | BCrypt (`BCrypt.Net-Next`) |
| Google sign-in | `Google.Apis.Auth` (ID token validation) |
| API docs | Swagger / OpenAPI (`Swashbuckle.AspNetCore`) — dev only |
| Real-time | SignalR (`NotificationsHub`) |
| AI | OpenAI HTTP API (`gpt-4o-mini` default), multiple dedicated services |
| File storage | Local filesystem (`LocalFileStorageService`) |

**Swagger title:** `SkillSwap API v1`  
**JWT issuer/audience:** `SkillSwap.API` / `SkillSwap.Client`  
**Default database name:** `skillswap_db`

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Clients (web / mobile)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS + JWT
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              GraduationProject.API (ASP.NET Core)                │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ Controllers  │→ │ Services    │→ │ Repositories (courses)   │ │
│  └──────────────┘  └─────────────┘  └──────────────────────────┘ │
│         │                 │                                      │
│         ▼                 ▼                                      │
│  RoleAuthorizationMiddleware   OpenAI HttpClients                │
│  JWT + [Authorize(Roles=...)]  IFileStorageService               │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ApplicationDbContext              SignalR Hub
              │                      /hubs/notifications
              ▼
         PostgreSQL
```

### Request pipeline (`Program.cs`)

1. CORS policy `AllowFrontend` (localhost dev ports + Expo).
2. Swagger UI (Development only, root route).
3. Static files (uploaded images/assets).
4. `RoleAuthorizationMiddleware` — wraps 401/403 with JSON messages.
5. Authentication → Authorization.
6. Controllers + `NotificationsHub`.

### Design patterns in use

- **Controller → Service → DbContext** for auth, AI, recruitment workflow, notifications.
- **Repository pattern** for course-related aggregates (`ICourseRepository`, `ICourseTeamRepository`, etc.).
- **DTOs** for request/response contracts (`DTOs/` folder).
- **Helpers** for skills parsing, authorization claims (`SkillHelper`, `AuthorizationHelper`).

---

## 5. User Roles & Access Control

### Roles (`users.role`)

| Role value | Description |
|------------|-------------|
| `student` | Default student account with `student_profiles` |
| `doctor` | Faculty with `doctor_profiles` |
| `company` | Employer with `company_profiles` |
| `studentassociation` or `association` | Student organization account with `student_association_profiles` |

Registration and login return a **JWT** containing user id, email, name, role, and profile id.

### Authentication endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register/student` | Student registration (via `IStudentRegisterService`) |
| POST | `/api/auth/register/doctor` | Doctor registration |
| POST | `/api/auth/register/company` | Company registration (requires website/LinkedIn or 40+ char description) |
| POST | `/api/auth/register/association` | Student association registration |
| POST | `/api/auth/company/analyze` | Pre-registration AI analysis of company from URL/description |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/google` | Google ID token → platform JWT |

### Authorization

- Most routes require `[Authorize]` (valid JWT).
- Sensitive routes add `[Authorize(Roles = "...")]` (e.g. `doctor`, `student`, `company`, `studentassociation,association`).
- SignalR hub accepts JWT via query string: `?access_token={token}` on `/hubs/*`.

---

## 6. Domain Modules

### 6.1 Graduation Projects (Core Project Engine)

**Purpose:** End-to-end lifecycle for **student-owned graduation projects** (final year projects), separate from course assignments.

**Primary controller:** `StudentProjectController`  
**Routes (aliases):** `/api/graduation-projects` and `/api/student-projects`

**Capabilities:**

- **Discovery** — list/browse all projects; filter by skills, major, availability.
- **CRUD** — create, update, delete (owner only).
- **Membership** — join, leave, remove member, transfer leadership.
- **Invitations** — owner/leader invites students (`InvitationsController` for accept/reject/cancel).
- **Supervision** — request doctor supervisor, cancel request, doctor accept/reject; doctor resignation flow with cancellation requests.
- **Recommendations** — available students, AI-ranked students, AI-ranked supervisors (also exposed under `/api/ai`).

**Project entity highlights (`graduation_projects`):**

| Field | Meaning |
|-------|---------|
| `name`, `abstract` | Title and description |
| `project_type` | `GP1`, `GP2`, or `GP` (Engineering & IT only for GP1/GP2) |
| `required_skills` | JSON array of skill name strings |
| `partners_count` | Total team size **including owner**; `0` = solo |
| `supervisor_id` | Set when a doctor accepts supervision |
| `owner_id` | One project per owner (unique index) |

**Member roles:** `leader` (owner by default), `member`.

---

### 6.2 Student Profiles & Skills

**Purpose:** Rich student profiles for matching and search.

**Student profile fields include:** major, university, faculty, academic year, GPA, bio, availability, looking-for, GitHub, LinkedIn, portfolio, languages/tools/roles/technical skills (JSON strings), profile picture (base64).

**Skills system:**

- Global `skills` catalog with categories.
- `student_skills` join table with proficiency `level` (1+).

**Controllers:** `StudentsController`, `ProfileController`, `MeController`, `SearchController`.

---

### 6.3 Doctors & Supervision

**Purpose:** Faculty discovery and supervision workflow.

**Doctor profile:** specialization, supervision capacity, university, faculty, department, experience, office hours, technical/research skills.

**Doctor dashboard** (`DoctorDashboardController`, `/api/doctors/me`):

- Incoming supervisor requests.
- List of supervised graduation projects.
- Dashboard summary counts.
- Resign from supervision (`resign-supervision/{projectId}`).

**Public discovery:** `DoctorsController` — list/search doctors.

---

### 6.4 Courses, Sections & Course Projects

**Purpose:** Academic course management where doctors assign **course projects** and form **teams** among enrolled students.

**Owned by:** `CoursesController` (`/api/courses`), `SectionsController`, `CourseTeamConversationsController`, `TeamChatController`.

**Hierarchy:**

```
Course (doctor-owned)
  └── CourseSection(s) (schedule, days, time)
        └── SectionEnrollment (student ↔ section)
  └── CourseProject (assignment within course)
        └── CourseProjectSection (optional section targeting)
        └── CourseTeam(s) (generated or manual)
              └── CourseTeamMember (student + match_score)
```

**Course project settings:**

| Field | Values / meaning |
|-------|------------------|
| `team_size` | Target members per team |
| `apply_to_all_sections` | If false, limited to linked sections |
| `allow_cross_section_teams` | Cross-section mixing when applying to all sections |
| `ai_mode` | `"doctor"` = instructor triggers AI team generation; `"student"` = students pick partners manually |

**Student flows:**

- View enrolled courses.
- See course projects and their team.
- **Manual team building:** send team invitations, accept/reject.
- **AI recommendations** for manual team selection (`ai-team-recommendations`).

**Doctor flows:**

- Create/update/delete courses, sections, enroll students.
- Create/update/delete course projects.
- **Generate teams** (OpenAI `ITeamGenerationService`) when `ai_mode = doctor`.
- Inspect and edit generated teams (add/remove members).

---

### 6.5 Companies & Talent Matching

**Purpose:** Companies find students matching internship/job-style needs.

**Controller:** `CompanyController` (`/api/company`, role `company`)

- View company profile.
- **Talent search** — creates `company_talent_requests`, uses `ICompanyTalentMatchService` + OpenAI ranking.
- List past talent requests (last 20).

**Registration assist:** `/api/auth/company/analyze` uses `ICompanyAnalysisService` (may fetch company website) before signup.

---

### 6.6 Student Associations / Organizations

**Purpose:** Student clubs manage public presence, events, team pages, recruitment, and membership.

**Profile:** `student_association_profiles` — name, username (unique), faculty, category, social links, verification flag, logo.

#### Public & student-facing (`OrganizationsController`)

- List public organizations.
- Organization detail, follow/unfollow (students).
- Public recruitment campaigns and events.

#### Organization admin (role `studentassociation` / `association`)

| Area | Controller prefix | Features |
|------|-------------------|----------|
| Profile | `/api/association` | Logo upload, profile CRUD |
| Events | `/api/organization/events` | CRUD, cover image upload |
| Event registration forms | `/api/organization/events/{id}/registration-form` | Dynamic fields (add/update/delete) |
| Team members (leadership page) | `/api/organization/team-members` | CRUD, image upload |
| Recruitment campaigns | `/api/organization/recruitment-campaigns` | CRUD, cover upload, publish flag |
| Campaign questions | `.../questions` | Per-campaign or per-position questions |
| Applications (org view) | `.../applications` | List, detail, status patch, **AI analyze/regenerate applicants** |
| Application decisions | `/api/organization/recruitment-applications` | Accept/reject |
| Members roster | `/api/organization/members` | Internal membership list |

#### Student applicant flows

- Apply to positions (`/api/organizations/{orgId}/recruitment-campaigns/{campaignId}/...`).
- Upload application files.
- View own applications.

**Membership kinds:** `Leadership`, `Member` — linked to accepted applications and team roster entries via `IOrganizationMembershipService`.

---

### 6.7 Invitations (Graduation Project)

**Controller:** `InvitationsController` (`/api/invitations`)

- List received invitations.
- List sent invitations per project.
- Accept / reject / cancel with notifications to involved users.

---

### 6.8 Dashboard & Analytics (Student/Doctor)

**Controller:** `DashboardController` (`/api/dashboard`)

| Endpoint | Student | Doctor |
|----------|---------|--------|
| `GET /summary` | Profile strength, teammates, project, counts | Supervision-focused summary |
| `GET /teammates` | Skill-overlap based suggestions | Empty list |
| `GET /profile-strength` | Completeness score | Empty |
| `GET /my-project` | Owned or member project | `null` |

> Student teammate suggestions use **skill overlap heuristics** in-dashboard; full AI ranking is on graduation project and course endpoints.

---

### 6.9 Notifications

**Controller:** `NotificationsController` (`/api/notifications`)

- Paginated notification list.
- Unread count.
- Mark one read, mark all read, mark by scope.

**Service:** `GraduationProjectNotificationService` persists to `user_notifications` and pushes via SignalR.

**Categories (constants):**

- `graduation_project`
- `chat`
- `course`
- `organization_event`
- `organization_recruitment`

Events include: project created/updated/deleted, member joined/left, invitations, supervisor requests, course team generation, recruitment status changes, etc.

---

### 6.10 Global Search

**Controller:** `SearchController` (`GET /api/search?query=`)

Returns up to 5 students and 5 doctors matching name, email, major, faculty, skills, etc. Student `id` in results is **UserId** (for navigation to `/api/students/{userId}`).

---

## 7. Data Model

### Core tables (PostgreSQL)

| Table | Entity | Notes |
|-------|--------|-------|
| `users` | `User` | Central auth; unique email |
| `student_profiles` | `StudentProfile` | 1:1 with user |
| `doctor_profiles` | `DoctorProfile` | 1:1 with user |
| `company_profiles` | `CompanyProfile` | 1:1 with user |
| `student_association_profiles` | `StudentAssociationProfile` | 1:1 with user; unique username |
| `skills` / `student_skills` | Skill catalog | |
| `graduation_projects` | `StudentProject` | Unique owner |
| `graduation_project_members` | `StudentProjectMember` | Unique (project, student) |
| `project_invitations` | `ProjectInvitation` | status: pending/... |
| `supervisor_requests` | `SupervisorRequest` | |
| `supervisor_cancellation_requests` | `SupervisorCancellationRequest` | Doctor-initiated resignation |
| `courses` | `Course` | Doctor-owned |
| `course_sections` | `CourseSection` | JSON `days` schedule |
| `section_enrollments` | `SectionEnrollment` | Unique per section+student |
| `course_projects` | `CourseProject` | |
| `course_project_sections` | `CourseProjectSection` | |
| `course_teams` / `course_team_members` | Generated teams | Includes `match_score` |
| `course_team_messages` | Team chat | |
| `section_chat_messages` | Section-wide chat | |
| `conversations` / `conversation_users` / `messages` | Private messaging | Optional link to `course_team_id` |
| `user_notifications` | In-app notifications | Optional `dedup_key` |
| `organization_follows` | Student follows org | |
| `student_organization_events` | Events | |
| `student_organization_event_registration_*` | Custom forms | |
| `student_organization_recruitment_*` | Campaigns, positions, questions, applications, analyses | |
| `student_organization_members` | Org membership | |
| `student_organization_team_members` | Public team display | |
| `company_talent_requests` | Company searches | |

### Important relationships

- **One graduation project per student** — enforced in application logic (`CheckProjectConflict`): cannot own a project and join another; cannot join if already owner or member elsewhere.
- **One owner per graduation project** — DB unique index on `graduation_projects.owner_id`.
- **Supervisor** — optional `DoctorProfile` on project; set when request accepted.
- **Course team conversation** — `Conversation.CourseTeamId` unique when set.

---

## 8. API Reference by Module

> All routes are prefixed with `/api` unless noted. Most require `Authorization: Bearer {jwt}`.

### Authentication — `/api/auth`

| Method | Path |
|--------|------|
| POST | `register/student`, `register/doctor`, `register/company`, `register/association` |
| POST | `company/analyze`, `login`, `google` |

### Current user — `/api/me`, `/api/profile`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/me` | Current user + profile |
| PUT | `/api/profile` | Update student profile |
| PUT | `/api/profile/doctor` | Update doctor profile |

### Graduation projects — `/api/graduation-projects` (alias: `/api/student-projects`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Discover projects |
| GET | `/my` | Current user's project |
| GET | `/{id}` | Project detail |
| GET | `/{id}/members` | Members list |
| GET | `/{projectId}/available-students` | Join candidates |
| GET | `/{projectId}/recommended-students` | AI-ranked teammates |
| POST | `/` | Create project |
| PUT | `/{id}` | Update (owner) |
| DELETE | `/{id}` | Delete (owner) |
| POST | `/{id}/join` | Join open project |
| DELETE | `/{id}/leave` | Leave project |
| DELETE | `{projectId}/members/{memberId}` | Remove member |
| PUT | `{projectId}/change-leader/{memberId}` | Transfer leadership |
| POST | `{projectId}/request-supervisor/{doctorId}` | Request supervision |
| POST | `{projectId}/request-supervisor-cancel` | Cancel pending request |
| GET | `{projectId}/recommended-supervisors` | AI-ranked doctors |
| POST | `{projectId}/invite/{receiverId}` | Invite student |
| POST | `/api/supervisor-requests/{id}/accept` | Doctor accepts |
| POST | `/api/supervisor-requests/{id}/reject` | Doctor rejects |
| GET | `/api/doctors/me/supervisor-cancel-requests` | Pending cancel requests |
| POST | `/api/supervisor-cancel-requests/{id}/accept` | Accept doctor resignation |
| POST | `/api/supervisor-cancel-requests/{id}/reject` | Reject resignation |

### Invitations — `/api/invitations`

| Method | Path |
|--------|------|
| GET | `received`, `sent/{projectId}` |
| POST | `{id}/accept`, `{id}/reject`, `{id}/cancel` |

### Students — `/api/students`

| Method | Path |
|--------|------|
| GET | `/`, `/{userId}`, `/filters` |
| GET | `followed-organizations`, `following-organizations` |
| PUT | `/{userId}` |

### Doctors — `/api/doctors`, `/api/doctors/me`

| Method | Path |
|--------|------|
| GET | `/api/doctors`, `/api/doctors/{doctorId}` |
| GET | `/api/doctors/me/requests`, `supervised-projects`, `dashboard-summary` |
| POST | `/api/doctors/me/resign-supervision/{projectId}` |

### Dashboard — `/api/dashboard`

| Method | Path |
|--------|------|
| GET | `summary`, `teammates`, `profile-strength`, `my-project` |

### AI — `/api/ai`

| Method | Path |
|--------|------|
| POST | `recommend-students` |
| POST | `recommend-supervisors` |

### Courses — `/api/courses`

Key routes (role-dependent):

| Method | Path | Role |
|--------|------|------|
| GET | `my` | doctor |
| GET | `enrolled` | student |
| POST | `/` | doctor — create course |
| GET | `{courseId}` | doctor, student |
| GET/POST | `{courseId}/sections`, `sections/{sectionId}/students` | doctor |
| GET/POST/PUT/DELETE | `{courseId}/projects`, `projects/{projectId}` | doctor |
| POST | `{courseId}/projects/{projectId}/generate-teams` | doctor |
| GET | `{courseId}/projects/{projectId}/teams` | doctor |
| GET | `projects/{projectId}/my-team` | student |
| GET | `{courseId}/projects/{projectId}/ai-team-recommendations` | student |
| POST | `.../manual-team/requests/{receiverId}` | student |
| GET/POST | `team-invitations`, `team-invitations/{id}/accept|reject` | student |

### Section & team chat

| Method | Path |
|--------|------|
| GET/POST | `/api/sections/{sectionId}/chat` |
| GET/POST | `/api/teams/{teamId}/chat` |
| POST | `/api/course-teams/{teamId}/conversation` |

### Messaging — `/api/conversations`, `/api/messages`

| Method | Path |
|--------|------|
| GET/POST/DELETE | `/api/conversations`, `/{id}`, `/start/{targetUserId}` |
| POST/PUT/DELETE | `/api/messages`, `/{id}`, `/{conversationId}/seen` |

### Company — `/api/company`

| Method | Path |
|--------|------|
| GET | `profile` |
| POST | `talent-search` |
| GET | `talent-requests` |

### Organizations (public + admin)

See controllers: `OrganizationsController`, `OrganizationEventsController`, `OrganizationRecruitmentCampaignsController`, `OrganizationRecruitmentApplicationsController`, `StudentAssociationProfileController`, etc.

### Notifications & search

| Method | Path |
|--------|------|
| GET | `/api/notifications`, `unread-count` |
| POST | `/api/notifications/{id}/read`, `read-all`, `read-scope` |
| GET | `/api/search?query=` |

### SignalR

| Hub | URL |
|-----|-----|
| `NotificationsHub` | `/hubs/notifications` |

---

## 9. AI-Powered Features

All AI features use **OpenAI** via typed HTTP clients. Configuration:

```json
"OpenAI": {
  "ApiKey": "",
  "Model": "gpt-4o-mini"
}
```

Environment override: `OpenAI__ApiKey` (highest priority).

If the API key is missing, AI endpoints fail gracefully with warnings at startup.

### Services

| Service | Interface | Used for |
|---------|-----------|----------|
| `OpenAiStudentRecommendationService` | `IAiStudentRecommendationService` | Rank students for GP teammates, supervisors, company talent |
| `OpenAiTeamGenerationService` | `ITeamGenerationService` | Doctor-triggered course team generation |
| `OpenAiRecruitmentApplicantAnalysisService` | `IRecruitmentApplicantAnalysisService` | Score/analyze org recruitment applicants |
| `OpenAiCompanyAnalysisService` | `ICompanyAnalysisService` | Company profile inference at registration |

### AI business rules (examples)

- **Teammate recommendations:** Same major as project owner; excludes existing members and students who already own a graduation project; max ~20 candidates; match score threshold for teammates.
- **Supervisor recommendations:** Considers specialization, capacity, project abstract/skills.
- **Course team generation:** Only when `AiMode == "doctor"`; uses enrolled students' skills from profiles.
- **Recruitment analysis:** Organization can analyze or regenerate analysis per position batch.

---

## 10. Real-Time Notifications

1. Event occurs (e.g. invitation accepted).
2. `GraduationProjectNotificationService` inserts row in `user_notifications`.
3. SignalR hub notifies connected clients for that user.

Notifications support **deduplication** via `dedup_key` (unique per user when set).

---

## 11. Messaging & Chat

Three chat layers:

1. **Section chat** — all students in a course section (`section_chat_messages`).
2. **Course team chat** — members of a generated/manual team (`course_team_messages`).
3. **Private conversations** — 1:1 (or group metadata) with edit/delete/seen flags; can be linked to a course team for doctor-initiated team conversations.

---

## 12. Business Rules & Constraints

### Graduation projects

| Rule | Detail |
|------|--------|
| One project affiliation | Student may **own** OR **be member of** at most one graduation project. |
| Owner uniqueness | DB enforces one row per `owner_id`. |
| Team capacity | `partners_count` includes owner; join blocked when full. |
| Project types | Engineering & IT faculty: `GP1`, `GP2`, `GP`. Others: forced to `GP`. |
| Leadership | Owner is `leader`; can transfer via `change-leader`. |
| AI recommendations | Only owner or team leader can request AI teammate lists. |
| Joining | Cannot join own project; cannot join if already member elsewhere. |

### Supervisor workflow

1. Team sends `SupervisorRequest` to a doctor (pending).
2. Doctor accepts → `supervisor_id` set on project; notifications sent.
3. Doctor may **resign** → creates `SupervisorCancellationRequest` → team accepts/rejects.

### Course projects

| Rule | Detail |
|------|--------|
| Team generation | Only `AiMode = doctor`; doctor must own the course. |
| Student mode | Students use manual invitations + optional AI suggestions. |
| Enrollments | Team generation uses section enrollments (all or selected sections). |

### Organizations

- One application per student per position (unique index).
- Published campaigns visible publicly; admin manages drafts via `is_published`.
- Accepted applications can flow into `student_organization_members` and public `team_members`.

### Companies

- Registration requires verifiable web presence (URL) or substantial description.

---

## 13. Configuration & Local Setup

### Prerequisites

- .NET 8 SDK
- PostgreSQL
- (Optional) OpenAI API key for AI features
- (Optional) Google OAuth client ID for Google login

### Configuration files

| File | Purpose |
|------|---------|
| `appsettings.json` | Connection string, JWT, Google, OpenAI |
| `appsettings.Development.json` | Local overrides (not committed with secrets) |
| `appsettings.Development.example.json` | Template |

### Example connection string

```
Host=localhost;Port=5432;Database=skillswap_db;Username=postgres;Password=***
```

### Run the API

```bash
cd backend/GraduationProject.API
dotnet ef database update   # apply migrations
dotnet run
```

- Development Swagger UI: root URL when `ASPNETCORE_ENVIRONMENT=Development`.
- CORS origins include `http://localhost:5173`, `3000`, `8081`.

### Migrations

EF Core migrations live in `backend/GraduationProject.API/Migrations/`. Schema evolves through dated migration files (courses, teams, organizations, recruitment, notifications, etc.).

---

## 14. Project Structure

```
backend/GraduationProject.API/
├── Controllers/          # HTTP API endpoints (30+ controllers)
├── Data/
│   └── ApplicationDbContext.cs
├── DTOs/                 # Request/response contracts
├── Helpers/              # SkillHelper, AuthorizationHelper, ...
├── Hubs/
│   └── NotificationsHub.cs
├── Interfaces/           # Repository interfaces (courses)
├── Middleware/
│   └── RoleAuthorizationMiddleware.cs
├── Migrations/           # EF Core PostgreSQL migrations
├── Models/               # EF entities / tables
├── Repositories/         # Course data access
├── Services/             # Auth, AI, notifications, file storage, workflows
├── Program.cs            # DI, middleware, SignalR, Swagger
└── appsettings*.json
```

---

## Appendix: Product Name Mapping

| Context | Name |
|---------|------|
| Repository folder | `GraduationProject` |
| Swagger / JWT / DB | `SkillSwap` |
| API assembly | `GraduationProject.API` |

---

## Document Metadata

| Field | Value |
|-------|-------|
| Based on | Backend source code only |
| API project | `backend/GraduationProject.API` |
| Target framework | .NET 8 |
| Last aligned with | Controllers, models, and `Program.cs` as present in repository |

---

*For interactive API exploration, run the backend in Development mode and use the Swagger UI at the application root.*
