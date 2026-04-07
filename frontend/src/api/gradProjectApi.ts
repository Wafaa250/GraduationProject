// api/gradProjectApi.ts
//
// Type definitions + API functions for the Graduation Project API.
// Mirrors the backend DTOs in StudentProjectController.cs exactly:
//   – StudentProjectMemberDto   → GradProjectMember
//   – StudentProjectResponseDto → GradProject
//
// The /my endpoint wraps the project in a role envelope — see MyProjectResponse.

import api from './axiosInstance'

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
 *   ownerUserId, ownerName, description, isOwner,
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

  /** Project description; null when not provided. */
  description?: string | null

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

// ─── API functions ────────────────────────────────────────────────────────────

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