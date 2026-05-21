// api/gradProjectApi.ts
//
// Type definitions + API functions for the Graduation Project API.
// Mirrors the backend DTOs in StudentProjectController.cs exactly:
//   – StudentProjectMemberDto   → GradProjectMember
//   – StudentProjectResponseDto → GradProject
//
// The /my endpoint wraps the project in a role envelope — see MyProjectResponse.

import api from './axiosInstance'
import { normalizeGradProject } from './gradProjectNormalize'

/** Matches backend graduation project type values. */
export type GraduationProjectType = 'GP1' | 'GP2' | 'GP'

/** Same rules as `IsEngineeringOrIT` in StudentProjectController (plus explicit registration labels). */
export function isEngineeringOrITFaculty(
  faculty: string | undefined | null,
): boolean {
  if (!faculty?.trim()) return false
  const f = faculty.trim()
  if (
    f === 'Engineering and Information Technology' ||
    f === 'Information Technology'
  ) {
    return true
  }
  const fl = f.toLowerCase()
  return (
    fl === 'engineering and information technology' ||
    (fl.includes('engineering') && fl.includes('it')) ||
    (fl.includes('engineering') && fl.includes('information technology')) ||
    (fl.includes('engineering') && fl.includes('technology'))
  )
}

/** Trims abstract; empty string becomes `null` for API JSON. */
export function abstractForApi(raw: string): string | null {
  const t = raw.trim()
  return t.length > 0 ? t : null
}

/**
 * Project type sent with create/update: Eng/IT students use their selection;
 * all other faculties must use GP (matches backend rules).
 */
export function projectTypeForApi(
  faculty: string | undefined | null,
  selected: GraduationProjectType,
): GraduationProjectType {
  return isEngineeringOrITFaculty(faculty) ? selected : 'GP'
}

/** POST /api/graduation-projects body (camelCase JSON). */
export interface CreateStudentProjectPayload {
  name: string
  abstract?: string | null
  projectType: GraduationProjectType
  requiredSkills: string[]
  partnersCount: number
}

/** PUT /api/graduation-projects/{id} body — fields optional per backend UpdateStudentProjectDto. */
export interface UpdateStudentProjectPayload {
  name?: string | null
  abstract?: string | null
  projectType?: GraduationProjectType | null
  requiredSkills?: string[] | null
  partnersCount?: number | null
}

// ─── Member ──────────────────────────────────────────────────────────────────

/**
 * Mirrors StudentProjectMemberDto from the backend.
 *
 * email, university, major, profilePicture, and joinedAt are typed as optional
 * here because they can be absent on certain list endpoints (e.g. GET /all) when
 * the caller is not the project owner, even though the backend always populates
 * them from the DB. Marking them optional keeps consuming code honest about
 * null-checking rather than assuming the fields are always present.
 */
export interface GradProjectMember {
  /** StudentProfile.Id — the student-profile primary key. */
  studentId: number

  /** AspNetUsers.Id — the auth-layer user id. */
  userId: number

  /** Display name from User.Name. */
  name: string

  /** User.Email — optional; always populated by the backend but safe to guard. */
  email?: string

  /** StudentProfile.University */
  university?: string

  /** StudentProfile.Major */
  major?: string

  /** Base64-encoded profile picture, or null when not set. */
  profilePicture?: string | null

  /**
   * Membership role within the project team.
   *   'leader' — designated team lead (exactly one per project).
   *   'member' — regular participant.
   */
  role: 'leader' | 'member'

  /** ISO-8601 timestamp of when the student joined the project. */
  joinedAt?: string
}

// ─── Project ─────────────────────────────────────────────────────────────────

/**
 * Mirrors StudentProjectResponseDto from the backend (MapToDto helper).
 *
 * Fields present on every response (GET /all, GET /:id, GET /my):
 *   id, ownerId, name, partnersCount, currentMembers, isFull, members
 *
 * Fields that the backend always populates but may be absent on lightweight
 * list views in future API versions — typed optional for forward-compatibility:
 *   ownerUserId, ownerName, isOwner,
 *   remainingSeats, requiredSkills, createdAt, updatedAt
 */
export interface GradProject {
  /** StudentProject.Id — project primary key. */
  id: number

  /** StudentProfile.Id of the project creator/owner. */
  ownerId: number

  /** AspNetUsers.Id of the owner (auth layer). */
  ownerUserId?: number

  /** Display name of the project owner. */
  ownerName?: string

  /** Project title. */
  name: string

  /** Project abstract; null when not provided. */
  abstract?: string | null

  /**
   * Legacy JSON field only — prefer `abstract` for display.
   * Kept optional for older responses/clients.
   */
  description?: string | null

  /** "GP1" | "GP2" | "GP" */
  projectType?: GraduationProjectType

  /**
   * Total team capacity including the owner.
   * Maps to StudentProject.PartnersCount on the backend.
   */
  partnersCount: number

  /** Number of StudentProjectMember rows currently in the team. */
  currentMembers: number

  /** True when currentMembers >= partnersCount. */
  isFull: boolean

  /**
   * True when the currently authenticated student is the project owner.
   * Undefined/absent for unauthenticated or non-student callers.
   */
  isOwner?: boolean

  /**
   * Remaining open seats: max(0, partnersCount − currentMembers).
   * Convenience field computed by the backend; derive locally if absent.
   */
  remainingSeats?: number

  /**
   * Skill names stored as a JSON array in the DB.
   * Deserialized to string[] by the backend before returning.
   */
  requiredSkills?: string[]

  /** Full member list, ordered leader-first then by joinedAt ascending. */
  members: GradProjectMember[]

  /** ISO-8601 creation timestamp. */
  createdAt?: string

  /** ISO-8601 last-updated timestamp. */
  updatedAt?: string

  /**
   * Assigned supervisor info when a doctor has accepted supervision.
   * Null/undefined means no supervisor is currently attached.
   *
   * - doctorId: DoctorProfiles.Id (for API e.g. request-supervisor).
   * - userId: AspNetUsers.Id (for GET /api/doctors/{userId} and /doctors/:id routes).
   */
  supervisor?: {
    doctorId: number
    userId: number
    name: string
    specialization: string
    department?: string | null
  } | null

  /**
   * Optional cancellation-request status when exposed by backend responses.
   * Some API payloads may omit this field.
   */
  supervisorCancellationRequestStatus?: 'pending' | 'approved' | 'rejected' | string | null

  /**
   * Optional: outstanding supervision request status (pending / accepted / rejected).
   * When absent, the UI may infer state from `supervisor` and recent actions.
   */
  supervisorRequestStatus?: 'pending' | 'accepted' | 'rejected' | string | null

  /**
   * Doctor targeted by a pending supervision request (from backend when status is pending).
   */
  pendingSupervisor?: {
    doctorId: number
    name: string
    specialization?: string
  } | null
}

// ─── /my endpoint envelope ───────────────────────────────────────────────────

/**
 * Response shape for GET /api/graduation-projects/my.
 *
 * role is null when the student has no project affiliation at all.
 * project is null in the same case.
 */
export interface MyProjectResponse {
  role: 'owner' | 'member' | null
  project: GradProject | null
}

// ─── /members endpoint ───────────────────────────────────────────────────────

/**
 * Response shape for GET /api/graduation-projects/:id/members.
 * Richer than the embedded members array on GradProject — includes
 * caller-aware management flags and explicit capacity fields.
 */
export interface ProjectMembersResponse {
  projectId: number
  currentMembers: number
  totalCapacity: number
  remainingSeats: number
  isFull: boolean
  /** True when the caller is the project owner. */
  isOwner: boolean
  /** True when the caller has the 'leader' role in the team. */
  isLeader: boolean
  members: GradProjectMember[]
}

// ─── Mutation response shapes ─────────────────────────────────────────────────

/**
 * Response body for DELETE …/members/{memberId}.
 * currentMembers reflects the DB count after the removal.
 */
export interface RemoveMemberResponse {
  message: string
  currentMembers: number
}

/**
 * Response body for PUT …/change-leader/{memberId}.
 * newLeaderId is the StudentProfile.Id of the newly promoted leader.
 */
export interface ChangeLeaderResponse {
  message: string
  newLeaderId: number
}

// ─── AI / recommendations ───────────────────────────────────────────────────────

function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0
  if (score > 0 && score <= 1) return Math.round(score * 100)
  return Math.round(Math.min(100, Math.max(0, score)))
}

/** Mirrors POST /ai/recommend-supervisors department filter (+ CE → electrical). */
function departmentMatchesStudentMajor(
  department: string,
  studentMajor: string,
): boolean {
  const d = department.trim().toLowerCase()
  const m = studentMajor.trim().toLowerCase()
  if (!d || !m) return false
  if (d.includes(m) || m.includes(d)) return true
  if (m === 'computer engineering' && d.includes('electrical engineering')) {
    return true
  }
  const computerStudent =
    m.includes('computer') &&
    (m.includes('science') || m.includes('engineering') || m.includes('sci'))
  if (computerStudent && d.includes('computer')) return true
  return false
}

function scoreSupervisorSkillMatch(
  requiredSkills: string[],
  specialization: string,
): number {
  const spec = specialization.trim()
  if (!spec) return 0
  const req = requiredSkills.map((s) => s.trim()).filter(Boolean)
  if (req.length === 0) return 50
  const matched = req.filter((skill) =>
    spec.toLowerCase().includes(skill.toLowerCase()),
  ).length
  return Math.round(Math.min((matched / req.length) * 100, 100))
}

/**
 * GET /api/graduation-projects/{projectId}/recommended-students
 * (and available-students) — mirrors ProjectAvailableStudentDto.
 */
export interface ProjectAvailableStudent {
  studentId: number
  userId: number
  name: string
  major: string
  university: string
  academicYear: string
  profilePicture?: string | null
  skills: string[]
  matchScore: number
  isMember: boolean
  hasPendingInvite: boolean
  isOwner: boolean
  ownsGraduationProject: boolean
  isProjectFull: boolean
  canInvite: boolean
}

export interface GradProjectRecommendedStudent {
  studentId: number
  userId: number
  name: string
  major: string
  university: string
  academicYear?: string
  profilePicture?: string | null
  skills: string[]
  matchScore: number
  reason?: string
  canInvite?: boolean
  hasPendingInvite?: boolean
  isMember?: boolean
  ownsGraduationProject?: boolean
}

export interface GradProjectRecommendedSupervisor {
  doctorId: number
  userId: number
  name: string
  specialization: string
  matchScore: number
  reason?: string
}

type AiSupervisorApiRow = {
  doctorId: number
  matchScore: number
  reason?: string
}

type DoctorDirectoryRow = {
  doctorId: number
  userId: number
  name: string
  specialization: string
  department: string
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * POST /api/graduation-projects
 *
 * Creates a project for the current student (owner + leader membership).
 */
export async function createGraduationProject(
  payload: CreateStudentProjectPayload,
): Promise<GradProject> {
  const { data } = await api.post<unknown>('/graduation-projects', payload)
  return normalizeGradProject(data)
}

/**
 * PUT /api/graduation-projects/{projectId}
 *
 * Owner-only full update of project fields.
 */
export async function updateGraduationProject(
  projectId: number,
  payload: UpdateStudentProjectPayload,
): Promise<GradProject> {
  const { data } = await api.put<unknown>(
    `/graduation-projects/${projectId}`,
    payload,
  )
  return normalizeGradProject(data)
}

/**
 * GET /api/graduation-projects/{projectId}
 *
 * Returns full project details (members, supervisor, abstract, skills).
 */
export async function getGraduationProjectById(projectId: number): Promise<GradProject> {
  const { data } = await api.get<unknown>(`/graduation-projects/${projectId}`)
  return normalizeGradProject(data)
}

function normalizeProjectAvailableStudent(raw: unknown): ProjectAvailableStudent | null {
  const r = asRecord(raw)
  if (!r) return null
  const studentId = Number(r.studentId ?? r.StudentId ?? 0)
  const userId = Number(r.userId ?? r.UserId ?? 0)
  if (studentId <= 0) return null
  return {
    studentId,
    userId,
    name: String(r.name ?? r.Name ?? '').trim() || `Student #${studentId}`,
    major: String(r.major ?? r.Major ?? '').trim(),
    university: String(r.university ?? r.University ?? '').trim(),
    academicYear: String(r.academicYear ?? r.AcademicYear ?? '').trim(),
    profilePicture: (r.profilePicture ?? r.ProfilePicture ?? null) as string | null,
    skills: Array.isArray(r.skills ?? r.Skills)
      ? (r.skills ?? r.Skills).map((s: unknown) => String(s).trim()).filter(Boolean)
      : [],
    matchScore: normalizeMatchScore(Number(r.matchScore ?? r.MatchScore ?? 0)),
    isMember: Boolean(r.isMember ?? r.IsMember),
    hasPendingInvite: Boolean(r.hasPendingInvite ?? r.HasPendingInvite),
    isOwner: Boolean(r.isOwner ?? r.IsOwner),
    ownsGraduationProject: Boolean(
      r.ownsGraduationProject ?? r.OwnsGraduationProject,
    ),
    isProjectFull: Boolean(r.isProjectFull ?? r.IsProjectFull),
    canInvite: Boolean(r.canInvite ?? r.CanInvite),
  }
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object') return null
  return raw as Record<string, unknown>
}

/**
 * GET /api/graduation-projects/{projectId}/recommended-students
 * Owner-only; skill match vs project required skills.
 */
export async function getGraduationProjectRecommendedStudents(
  projectId: number,
): Promise<ProjectAvailableStudent[]> {
  const { data } = await api.get<unknown>(
    `/graduation-projects/${projectId}/recommended-students`,
  )
  if (!Array.isArray(data)) return []
  return data
    .map(normalizeProjectAvailableStudent)
    .filter((row): row is ProjectAvailableStudent => row != null)
}

/**
 * Suggested teammates — same as Dashboard “Find Best Teammates (AI)”:
 * POST /api/ai/recommend-students
 */
export async function fetchTeammateRecommendations(
  projectId: number,
): Promise<GradProjectRecommendedStudent[]> {
  return getRecommendedStudents(projectId)
}

async function fetchDoctorDirectory(): Promise<Map<number, DoctorDirectoryRow>> {
  const map = new Map<number, DoctorDirectoryRow>()
  try {
    const { data } = await api.get<unknown[]>('/doctors')
    if (!Array.isArray(data)) return map
    for (const raw of data) {
      const r = asRecord(raw)
      if (!r) continue
      const doctorId = Number(r.profileId ?? r.ProfileId ?? r.doctorId ?? r.DoctorId ?? 0)
      const userId = Number(r.userId ?? r.UserId ?? 0)
      if (doctorId <= 0) continue
      map.set(doctorId, {
        doctorId,
        userId,
        name: String(r.name ?? r.Name ?? '').trim(),
        specialization: String(r.specialization ?? r.Specialization ?? '').trim(),
        department: String(r.department ?? r.Department ?? '').trim(),
      })
    }
  } catch {
    /* optional enrichment */
  }
  return map
}

/**
 * POST /api/ai/recommend-supervisors — leader or owner; ranked with optional AI reason.
 */
async function getAiRecommendedSupervisors(
  projectId: number,
): Promise<AiSupervisorApiRow[]> {
  const { data } = await api.post<unknown>('/ai/recommend-supervisors', { projectId })
  if (!Array.isArray(data)) return []
  return data
    .map((raw) => {
      const r = asRecord(raw)
      if (!r) return null
      const doctorId = Number(r.doctorId ?? r.DoctorId ?? 0)
      if (doctorId <= 0) return null
      const reason = String(r.reason ?? r.Reason ?? '').trim()
      return {
        doctorId,
        matchScore: normalizeMatchScore(Number(r.matchScore ?? r.MatchScore ?? 0)),
        reason: reason || undefined,
      }
    })
    .filter((row): row is AiSupervisorApiRow => row != null)
}

function buildSupervisorReason(
  specialization: string,
  requiredSkills: string[],
  matchScore: number,
  aiReason?: string,
): string {
  if (aiReason?.trim()) return aiReason.trim()
  const spec = specialization.trim()
  const matched = requiredSkills.filter((s) =>
    spec.toLowerCase().includes(s.toLowerCase().trim()),
  )
  if (matched.length > 0) {
    return `Project skills (${matched.slice(0, 3).join(', ')}) align with their specialization.`
  }
  if (spec) {
    return `Specialization (${spec.slice(0, 100)}${spec.length > 100 ? '…' : ''}) fits your project domain.`
  }
  return matchScore > 0
    ? `Ranked at ${matchScore}% based on skill overlap with your project.`
    : 'Listed from your department — review fit before requesting.'
}

function mapListRowToSupervisor(
  row: GradProjectRecommendedSupervisor,
  requiredSkills: string[],
): GradProjectRecommendedSupervisor {
  return {
    ...row,
    matchScore: normalizeMatchScore(row.matchScore),
    reason: buildSupervisorReason(row.specialization, requiredSkills, row.matchScore),
  }
}

function supervisorsFromDoctorDirectory(
  doctorDir: Map<number, DoctorDirectoryRow>,
  studentMajor: string,
  requiredSkills: string[],
): GradProjectRecommendedSupervisor[] {
  const major = studentMajor.trim()
  if (!major) return []

  const rows: GradProjectRecommendedSupervisor[] = []
  for (const doc of doctorDir.values()) {
    if (!departmentMatchesStudentMajor(doc.department, major)) continue
    const spec = doc.specialization.trim() || doc.department.trim()
    const matchScore = Math.max(
      scoreSupervisorSkillMatch(requiredSkills, spec),
      requiredSkills.length === 0 ? 50 : 0,
    )
    rows.push({
      doctorId: doc.doctorId,
      userId: doc.userId,
      name: doc.name.trim() || `Supervisor #${doc.doctorId}`,
      specialization: spec,
      matchScore: matchScore > 0 ? matchScore : 50,
      reason: buildSupervisorReason(spec, requiredSkills, matchScore),
    })
  }

  return rows
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12)
}

/**
 * Loads supervisor recommendations: POST /ai/recommend-supervisors merged with
 * GET /recommended-supervisors and GET /doctors; falls back to directory scoring
 * when AI/GET return empty (e.g. Computer Science vs Computer Engineering dept).
 */
export async function fetchSupervisorRecommendations(
  projectId: number,
  requiredSkills: string[] = [],
  options?: { studentMajor?: string },
): Promise<GradProjectRecommendedSupervisor[]> {
  const [aiRows, listRows, doctorDir] = await Promise.all([
    getAiRecommendedSupervisors(projectId).catch(() => [] as AiSupervisorApiRow[]),
    getRecommendedSupervisors(projectId).catch(() => [] as GradProjectRecommendedSupervisor[]),
    fetchDoctorDirectory(),
  ])

  const listByDoctorId = new Map(
    listRows.map((r) => [r.doctorId, { ...r, matchScore: normalizeMatchScore(r.matchScore) }]),
  )

  if (aiRows.length > 0) {
    return aiRows.map((ai) => {
      const fromList = listByDoctorId.get(ai.doctorId)
      const fromDir = doctorDir.get(ai.doctorId)
      const resolvedName =
        fromList?.name?.trim() || fromDir?.name?.trim() || ''
      const resolvedSpec =
        fromList?.specialization?.trim() ||
        fromDir?.specialization?.trim() ||
        fromDir?.department?.trim() ||
        ''
      const userId = fromList?.userId && fromList.userId > 0
        ? fromList.userId
        : (fromDir?.userId ?? 0)

      return {
        doctorId: ai.doctorId,
        userId,
        name: resolvedName || `Supervisor #${ai.doctorId}`,
        specialization: resolvedSpec,
        matchScore: ai.matchScore,
        reason: buildSupervisorReason(resolvedSpec, requiredSkills, ai.matchScore, ai.reason),
      }
    })
  }

  if (listRows.length > 0) {
    return listRows.map((row) => mapListRowToSupervisor(row, requiredSkills))
  }

  const fallback = supervisorsFromDoctorDirectory(
    doctorDir,
    options?.studentMajor ?? '',
    requiredSkills,
  )
  if (fallback.length > 0) return fallback

  return []
}

/**
 * GET /api/graduation-projects/{projectId}/members
 *
 * Returns the full team snapshot for a project, including caller-aware
 * management flags (isOwner, isLeader) and capacity fields.
 * Accessible by any authenticated student — not owner-only.
 */
export async function getProjectMembers(
  projectId: number,
): Promise<ProjectMembersResponse> {
  const { data } = await api.get<ProjectMembersResponse>(
    `/graduation-projects/${projectId}/members`,
  )
  return data
}

/**
 * DELETE /api/graduation-projects/{projectId}/members/{memberId}
 *
 * Removes a member from the project team.
 *   - Caller must be the current team leader.
 *   - memberId is StudentProfile.Id (not UserId).
 *   - The leader cannot remove themselves (backend enforces this).
 *
 * Returns a confirmation message and the updated member count.
 */
export async function removeProjectMember(
  projectId: number,
  memberId: number,
): Promise<RemoveMemberResponse> {
  const { data } = await api.delete<RemoveMemberResponse>(
    `/graduation-projects/${projectId}/members/${memberId}`,
  )
  return data
}

/**
 * PUT /api/graduation-projects/{projectId}/change-leader/{memberId}
 *
 * Transfers the 'leader' role to another existing team member.
 *   - Caller must currently hold the 'leader' role.
 *   - memberId is StudentProfile.Id of the intended new leader.
 *   - The current leader becomes a regular 'member' (backend enforces exactly
 *     one leader at all times).
 *
 * Returns a confirmation message and the StudentProfile.Id of the new leader.
 */
export async function changeProjectLeader(
  projectId: number,
  memberId: number,
): Promise<ChangeLeaderResponse> {
  const { data } = await api.put<ChangeLeaderResponse>(
    `/graduation-projects/${projectId}/change-leader/${memberId}`,
  )
  return data
}

function mapAiStudentRecommendation(raw: unknown): GradProjectRecommendedStudent | null {
  const r = asRecord(raw)
  if (!r) return null
  const studentId = Number(r.studentId ?? r.StudentId ?? 0)
  if (studentId <= 0) return null
  const skillRaw = r.skills ?? r.Skills
  const skills = Array.isArray(skillRaw)
    ? skillRaw.map((s) => String(s).trim()).filter(Boolean)
    : []
  const reason = String(r.reason ?? r.Reason ?? '').trim()
  return {
    studentId,
    userId: Number(r.userId ?? r.UserId ?? 0),
    name: String(r.name ?? r.Name ?? '').trim() || `Student #${studentId}`,
    major: String(r.major ?? r.Major ?? '').trim(),
    university: String(r.university ?? r.University ?? '').trim(),
    academicYear: String(r.academicYear ?? r.AcademicYear ?? '').trim() || undefined,
    profilePicture: (r.profilePicture ?? r.ProfilePicture ?? null) as string | null,
    skills,
    matchScore: normalizeMatchScore(Number(r.matchScore ?? r.MatchScore ?? 0)),
    reason: reason || undefined,
  }
}

/**
 * POST /api/ai/recommend-students
 *
 * Skill-based teammate suggestions (OpenAI ranking + rule fallback). Owner or leader only.
 */
export async function getRecommendedStudents(
  projectId: number,
): Promise<GradProjectRecommendedStudent[]> {
  const { data } = await api.post<unknown>('/ai/recommend-students', { projectId })
  if (!Array.isArray(data)) return []
  return data
    .map(mapAiStudentRecommendation)
    .filter((row): row is GradProjectRecommendedStudent => row != null)
    .sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * GET /api/graduation-projects/{projectId}/recommended-supervisors
 *
 * Project leader only; doctors ranked by skill match.
 */
export async function getRecommendedSupervisors(
  projectId: number,
): Promise<GradProjectRecommendedSupervisor[]> {
  const { data } = await api.get<unknown[]>(
    `/graduation-projects/${projectId}/recommended-supervisors`,
  )
  if (!Array.isArray(data)) return []
  return data
    .map((raw: Record<string, unknown>) => ({
      doctorId: Number(raw.doctorId ?? raw.DoctorId ?? 0),
      userId: Number(raw.userId ?? raw.UserId ?? 0),
      name: String(raw.name ?? raw.Name ?? '').trim(),
      specialization: String(raw.specialization ?? raw.Specialization ?? '').trim(),
      matchScore: normalizeMatchScore(Number(raw.matchScore ?? raw.MatchScore ?? 0)),
    }))
    .filter((row) => row.doctorId > 0)
}