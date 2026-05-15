import api from './axiosInstance'
import type { GradProject } from './gradProjectApi'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileStrength {
    score: number
    hasProfilePicture: boolean
    hasGeneralSkills: boolean
    hasMajorSkills: boolean
    hasBio: boolean
    hasGpa: boolean
}

export interface SuggestedTeammate {
    userId: number
    profileId: number
    name: string
    major: string
    university: string
    academicYear: string
    profilePicture: string | null
    skills: string[]
    matchScore: number
}

// يطابق DashboardProjectDto من الباك
export interface DashboardProject {
    projectId: number
    projectName: string
    role: 'owner' | 'member'
    memberCount: number
    maxTeamSize: number
    isFull: boolean
}

export interface DashboardSummary {
    name: string
    major: string
    university: string
    academicYear: string
    totalSkills: number
    profileStrength: ProfileStrength
    suggestedTeammates: SuggestedTeammate[]
    myProject: DashboardProject | null
    /** Hero stats (student dashboard); omitted for older API responses. */
    suggestedTeammatesCount?: number
    matchedGraduationProjectsCount?: number
    bestTeammateMatchPercent?: number | null
    pendingTeamInvitationsCount?: number
}

// ─── API Calls ────────────────────────────────────────────────────────────────

// جلب ملخص الداشبورد كامل
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary')
    return response.data
}

/** GET /api/dashboard/my-project — current project affiliation (student dashboard). */
export function parseDashboardProjectDto(raw: unknown): DashboardProject | null {
    if (raw == null || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const projectId = Number(r.projectId ?? r.ProjectId)
    const projectName = String(r.projectName ?? r.ProjectName ?? '').trim()
    const roleRaw = r.role ?? r.Role
    const role = roleRaw === 'owner' || roleRaw === 'member' ? roleRaw : null
    if (!Number.isFinite(projectId) || !projectName || !role) return null
    return {
        projectId,
        projectName,
        role,
        memberCount: Number(r.memberCount ?? r.MemberCount ?? 0),
        maxTeamSize: Number(r.maxTeamSize ?? r.MaxTeamSize ?? 0),
        isFull: Boolean(r.isFull ?? r.IsFull ?? false),
    }
}

export const getDashboardMyProject = async (): Promise<DashboardProject | null> => {
    const response = await api.get('/dashboard/my-project')
    return parseDashboardProjectDto(response.data)
}

// جلب الطلاب المقترحين فقط
export const getSuggestedTeammates = async (): Promise<SuggestedTeammate[]> => {
    const response = await api.get('/dashboard/teammates')
    return response.data
}

// جلب قوة البروفايل فقط
export const getProfileStrength = async (): Promise<ProfileStrength> => {
    const response = await api.get('/dashboard/profile-strength')
    return response.data
}

/** GET /graduation-projects/my — project only (matches backend envelope field `project`). */
export const getMyProject = async (): Promise<GradProject | null> => {
    const response = await api.get('/graduation-projects/my')
    const { project } = parseGraduationProjectsMyPayload(response.data)
    return project
}

/**
 * Same GET as getMyProject; returns role + project.
 * Tolerates camelCase or PascalCase JSON keys and optional wrapper `{ data: ... }`.
 */
export const getGraduationProjectsMyEnvelope = async (): Promise<{
    role: 'owner' | 'member' | null
    project: GradProject | null
}> => {
    const response = await api.get('/graduation-projects/my')
    return parseGraduationProjectsMyPayload(response.data)
}

function parseGraduationProjectsMyPayload(raw: unknown): {
    role: 'owner' | 'member' | null
    project: GradProject | null
} {
    const root =
        raw !== null &&
        typeof raw === 'object' &&
        'data' in raw &&
        (raw as { data?: unknown }).data !== undefined
            ? (raw as { data: unknown }).data
            : raw

    if (root === null || typeof root !== 'object') {
        return { role: null, project: null }
    }

    const d = root as {
        project?: GradProject | null
        Project?: GradProject | null
        role?: string | null
        Role?: string | null
    }

    const project = d.project ?? d.Project ?? null
    const roleRaw = d.role ?? d.Role
    const role = roleRaw === 'owner' || roleRaw === 'member' ? roleRaw : null

    return { role, project }
}