# Company Requests — Backend Design

**Source of truth:** Web Company Request wizard (`CompanyNewRequestPage`, `companyRequestStorage.ts`).

**Out of scope (v1):** AI matching, recommendations, invitations, legacy `POST /api/company/talent-search`.

---

## Frontend → backend field map

| Wizard / storage | `company_requests` | Notes |
|------------------|-------------------|--------|
| `type` | `request_type` | `individual` \| `ai-built-team` |
| `title` | `title` | |
| `description` | `description` | |
| `categoryChoice` + `categoryOther` | `category_choice`, `category_other`, `category` | `category` = resolved display value |
| `targetRole` + `requiredSkills` | → 1 × `company_request_roles` + skills | Individual |
| `teamRoles[]` | → N × roles + skills | AI-built team |
| `durationOngoing` | `duration_ongoing` | |
| `durationValue` / `durationUnit` | `duration_value`, `duration_unit` | |
| `duration` (label) | `duration_label` | Denormalized for list cards |
| `collaborationType` | `collaboration_format` | Enum `CollaborationFormat` → `remote`, `hybrid`, `on-site`, `flexible` |
| `durationUnit` | `duration_unit` | Enum `DurationUnit` → `Days`, `Weeks`, `Months`, `Semesters`, `Years` |
| `scopeNotes` | `scope_notes` | Optional |
| Draft `step` | `wizard_step` | 0–4, only when `status = draft` |

---

## Entity relationship

```
company_profiles (existing)
    └── company_requests (1 : many)
            └── company_request_roles (1 : many)
                    └── company_request_skills (1 : many)
```

- **Individual:** exactly one role row (enforced on submit).
- **AI-built team:** one or more role rows, each with ≥1 skill.
- **Skills** are stored by name (wizard allows custom skills); optional later FK to `skills` table.

---

## Status lifecycle

| Status | Meaning |
|--------|---------|
| `draft` | Wizard in progress; at most **one** per company (unique partial index) |
| `submitted` | Created via Review → Create Request |
| `archived` | Company withdrew / closed |
| `matching` | *Reserved* — AI job running |
| `matched` | *Reserved* — AI results available |

Columns `matching_status`, `matched_at` reserved for future AI module.

---

## REST API (`CompanyRequestsController`)

Base: `/api/company/requests` — `[Authorize(Roles = "company")]`

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/` | List requests (`?includeDraft=false` default) |
| `GET` | `/{id}` | Detail with roles + skills |
| `GET` | `/draft` | Current draft (`204` if none) |
| `PUT` | `/draft` | Upsert draft (Save draft) |
| `DELETE` | `/draft` | Clear draft |
| `POST` | `/` | Submit request (promotes draft or creates submitted) |
| `PATCH` | `/{id}/status` | Status transitions (archive, future matching) |

### Submit body (`CreateCompanyRequestDto`)

Aligns with frontend `saveLocalCompanyRequest` payload:

```json
{
  "requestType": "individual",
  "title": "...",
  "description": "...",
  "categoryChoice": "Software & Technology",
  "categoryOther": "",
  "targetRole": "Flutter Developer",
  "requiredSkills": ["Flutter", "Firebase"],
  "roles": [],
  "durationOngoing": false,
  "durationValue": 3,
  "durationUnit": "Months",
  "collaborationType": "remote",
  "scopeNotes": null
}
```

AI-built team uses `roles[]` instead of `targetRole` / `requiredSkills`:

```json
{
  "requestType": "ai-built-team",
  "roles": [
    {
      "clientRoleKey": "role-abc",
      "roleName": "Backend Developer",
      "skills": ["Node.js", "PostgreSQL"],
      "notes": "Optional",
      "sortOrder": 0
    }
  ]
}
```

---

## Code layout

| Layer | Files |
|-------|--------|
| Models | `Models/CompanyRequest.cs`, `CompanyRequestRole.cs`, `CompanyRequestSkill.cs` |
| DTOs | `DTOs/CompanyRequestDTOs.cs` |
| Mapping | `Helpers/CompanyRequestMapper.cs` |
| Service | `Services/ICompanyRequestService.cs`, `CompanyRequestService.cs` |
| API | `Controllers/CompanyRequestsController.cs` |
| DB | `Scripts/apply-company-requests.sql` or EF migration |

---

## Legacy coexistence

| Legacy | New |
|--------|-----|
| `company_talent_requests` | `company_requests` |
| `POST /api/company/talent-search` | `POST /api/company/requests` |
| `GET /api/company/talent-requests` | `GET /api/company/requests` |

Do not remove legacy tables/endpoints until mobile and dashboard are migrated.

---

## Next steps (not in this task)

1. `dotnet ef migrations add AddCompanyProjectRequests`
2. Wire `frontend` `companyApi.ts` + replace `localStorage`
3. AI matching service writing `matching_status` / student match tables (TBD)
