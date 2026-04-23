import axios from 'axios'
import api from './axiosInstance'

export interface DoctorCourse {
    courseId: number
    name: string
    code: string
    createdAt: string
    semester: string | null
    useSharedProjectAcrossSections: boolean
    allowCrossSectionTeams: boolean
    doctorId?: number
    doctorName?: string
    /** Present on course-detail responses; omitted on list endpoints such as GET /courses/my. */
    sectionCount?: number
    /** Present on course-detail responses; omitted on list endpoints such as GET /courses/my. */
    sections?: CourseSection[]
}

/** Mirrors CourseSectionDto — section row under a course. */
export interface CourseSection {
    id: number
    courseId: number
    name: string
    days: string[]
    /** "HH:mm" or null */
    timeFrom: string | null
    /** "HH:mm" or null */
    timeTo: string | null
    capacity: number
    /** Legacy; null on name-based sections. */
    sectionNumber: number | null
    studentCount: number
    createdAt: string
    projectSetting: SectionProjectSetting | null
}

/** Mirrors SectionProjectSettingDto — active per-section project configuration. */
export interface SectionProjectSetting {
    id: number
    courseSectionId: number
    title: string
    description: string | null
    teamSize: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateCourseSectionBody {
    name: string
    days: string[]
    /** "HH:mm" (24h) or empty string for none. */
    timeFrom: string
    timeTo: string
    capacity: number
}

export interface UpsertSectionProjectSettingBody {
    title: string
    description: string
    teamSize: number
}

export interface CreateCourseBody {
    name: string
    code: string
    semester: string | null
    useSharedProjectAcrossSections: boolean
    allowCrossSectionTeams: boolean
}

function mapSectionProjectSetting(raw: unknown): SectionProjectSetting {
    const r = raw as Record<string, unknown>
    const descRaw = r.description ?? r.Description
    return {
        id: Number(r.id ?? r.Id ?? 0),
        courseSectionId: Number(r.courseSectionId ?? r.CourseSectionId ?? 0),
        title: String(r.title ?? r.Title ?? ''),
        description:
            descRaw === undefined || descRaw === null ? null : String(descRaw),
        teamSize: Number(r.teamSize ?? r.TeamSize ?? 2),
        isActive: Boolean(r.isActive ?? r.IsActive ?? true),
        createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
        updatedAt: String(r.updatedAt ?? r.UpdatedAt ?? ''),
    }
}

function mapCourseSection(raw: unknown): CourseSection {
    const r = raw as Record<string, unknown>
    const psRaw = r.projectSetting ?? r.ProjectSetting
    const daysRaw = r.days ?? r.Days
    const tfRaw = r.timeFrom ?? r.TimeFrom
    const ttRaw = r.timeTo ?? r.TimeTo
    const snRaw = r.sectionNumber ?? r.SectionNumber
    return {
        id: Number(r.id ?? r.Id ?? 0),
        courseId: Number(r.courseId ?? r.CourseId ?? 0),
        name: String(r.name ?? r.Name ?? ''),
        days: Array.isArray(daysRaw) ? daysRaw.map((d) => String(d)) : [],
        timeFrom: tfRaw === undefined || tfRaw === null ? null : String(tfRaw),
        timeTo: ttRaw === undefined || ttRaw === null ? null : String(ttRaw),
        capacity: Number(r.capacity ?? r.Capacity ?? 0),
        sectionNumber:
            snRaw === undefined || snRaw === null ? null : Number(snRaw),
        studentCount: Number(r.studentCount ?? r.StudentCount ?? 0),
        createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
        projectSetting:
            psRaw === undefined || psRaw === null
                ? null
                : mapSectionProjectSetting(psRaw),
    }
}

function mapDoctorCourse(raw: unknown): DoctorCourse {
    const r = raw as Record<string, unknown>
    const id = r.courseId ?? r.CourseId ?? r.id ?? r.Id
    const semRaw = r.semester ?? r.Semester
    const sectionsRaw = r.sections ?? r.Sections
    return {
        courseId: Number(id ?? 0),
        name: String(r.name ?? r.Name ?? ''),
        code: String(r.code ?? r.Code ?? ''),
        createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
        semester: semRaw === undefined || semRaw === null ? null : String(semRaw),
        useSharedProjectAcrossSections: Boolean(
            r.useSharedProjectAcrossSections ?? r.UseSharedProjectAcrossSections ?? false,
        ),
        allowCrossSectionTeams: Boolean(
            r.allowCrossSectionTeams ?? r.AllowCrossSectionTeams ?? false,
        ),
        doctorId:
            r.doctorId !== undefined || r.DoctorId !== undefined
                ? Number(r.doctorId ?? r.DoctorId)
                : undefined,
        doctorName:
            r.doctorName !== undefined || r.DoctorName !== undefined
                ? String(r.doctorName ?? r.DoctorName ?? '')
                : undefined,
        sectionCount:
            r.sectionCount !== undefined || r.SectionCount !== undefined
                ? Number(r.sectionCount ?? r.SectionCount)
                : undefined,
        sections: Array.isArray(sectionsRaw)
            ? sectionsRaw.map(mapCourseSection)
            : undefined,
    }
}

export interface DoctorCourseDetail {
    id: number
    name: string
    code: string
    doctorId: number
    doctorName: string
    semester: string | null
    useSharedProjectAcrossSections: boolean
    allowCrossSectionTeams: boolean
    studentCount: number
    teamCount: number
    sectionCount: number
    createdAt: string
    /** Active shared project setting when UseSharedProjectAcrossSections is true. */
    projectSetting: DoctorCourseProjectSetting | null
    sections: CourseSection[]
}

export interface DoctorCourseStudent {
    studentId: number
    userId: number
    name: string
    university: string
    major: string
    /** University student ID string — required for POST .../sections/{id}/students. */
    universityId: string
    sectionId: number | null
    sectionNumber: number | null
}

function mapDoctorCourseDetail(raw: unknown): DoctorCourseDetail {
    const r = raw as Record<string, unknown>
    const semRaw = r.semester ?? r.Semester
    const sectionsRaw = r.sections ?? r.Sections
    const psRaw = r.projectSetting ?? r.ProjectSetting
    return {
        id: Number(r.id ?? r.Id ?? 0),
        name: String(r.name ?? r.Name ?? ''),
        code: String(r.code ?? r.Code ?? ''),
        doctorId: Number(r.doctorId ?? r.DoctorId ?? 0),
        doctorName: String(r.doctorName ?? r.DoctorName ?? ''),
        semester: semRaw === undefined || semRaw === null ? null : String(semRaw),
        useSharedProjectAcrossSections: Boolean(
            r.useSharedProjectAcrossSections ?? r.UseSharedProjectAcrossSections ?? false,
        ),
        allowCrossSectionTeams: Boolean(
            r.allowCrossSectionTeams ?? r.AllowCrossSectionTeams ?? false,
        ),
        studentCount: Number(r.studentCount ?? r.StudentCount ?? 0),
        teamCount: Number(r.teamCount ?? r.TeamCount ?? 0),
        sectionCount: Number(r.sectionCount ?? r.SectionCount ?? 0),
        createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
        projectSetting:
            psRaw === undefined || psRaw === null
                ? null
                : mapDoctorCourseProjectSetting(psRaw),
        sections: Array.isArray(sectionsRaw)
            ? sectionsRaw.map(mapCourseSection)
            : [],
    }
}

function mapDoctorCourseStudent(raw: unknown): DoctorCourseStudent {
    const r = raw as Record<string, unknown>
    const secIdRaw = r.sectionId ?? r.SectionId
    const secNumRaw = r.sectionNumber ?? r.SectionNumber
    return {
        studentId: Number(r.studentId ?? r.StudentId ?? 0),
        userId: Number(r.userId ?? r.UserId ?? 0),
        name: String(r.name ?? r.Name ?? ''),
        university: String(r.university ?? r.University ?? ''),
        major: String(r.major ?? r.Major ?? ''),
        universityId: String(r.universityId ?? r.UniversityId ?? '').trim(),
        sectionId:
            secIdRaw === undefined || secIdRaw === null ? null : Number(secIdRaw),
        sectionNumber:
            secNumRaw === undefined || secNumRaw === null ? null : Number(secNumRaw),
    }
}

export const getDoctorCourseDetail = async (
    courseId: number,
): Promise<DoctorCourseDetail> => {
    const response = await api.get(`/courses/${courseId}`)
    return mapDoctorCourseDetail(response.data)
}

export const getDoctorCourseStudents = async (
    courseId: number,
): Promise<DoctorCourseStudent[]> => {
    const response = await api.get(`/courses/${courseId}/students`)
    const data = response.data
    if (!Array.isArray(data)) return []
    return data.map(mapDoctorCourseStudent)
}

export const addStudentsToDoctorCourse = async (
    courseId: number,
    studentIds: string[],
): Promise<void> => {
    await api.post(`/courses/${courseId}/students`, { studentIds })
}

/** `studentId` is the enrolled student's profile id (same as GET .../students rows). */
export const removeStudentFromDoctorCourse = async (
    courseId: number,
    studentId: number,
): Promise<void> => {
    await api.delete(`/courses/${courseId}/students/${studentId}`)
}

export const getDoctorMyCourses = async (): Promise<DoctorCourse[]> => {
    const response = await api.get('/courses/my')
    const data = response.data
    if (!Array.isArray(data)) return []
    return data.map(mapDoctorCourse)
}

export const createDoctorCourse = async (
    body: CreateCourseBody,
): Promise<void> => {
    await api.post('/courses', body)
}

export interface DoctorCourseProjectSetting {
    id: number
    courseId: number
    title: string
    description: string | null
    teamSize: number
    fileUrl: string | null
    fileName: string | null
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
}

function mapDoctorCourseProjectSetting(raw: unknown): DoctorCourseProjectSetting {
    const r = raw as Record<string, unknown>
    const descRaw = r.description ?? r.Description
    return {
        id: Number(r.id ?? r.Id ?? 0),
        courseId: Number(r.courseId ?? r.CourseId ?? 0),
        title: String(r.title ?? r.Title ?? ''),
        description:
            descRaw === undefined || descRaw === null ? null : String(descRaw),
        teamSize: Number(r.teamSize ?? r.TeamSize ?? 2),
        fileUrl:
            r.fileUrl === undefined && r.FileUrl === undefined
                ? null
                : ((r.fileUrl ?? r.FileUrl ?? null) as string | null),
        fileName:
            r.fileName === undefined && r.FileName === undefined
                ? null
                : ((r.fileName ?? r.FileName ?? null) as string | null),
        isActive:
            r.isActive !== undefined || r.IsActive !== undefined
                ? Boolean(r.isActive ?? r.IsActive)
                : undefined,
        createdAt:
            r.createdAt !== undefined || r.CreatedAt !== undefined
                ? String(r.createdAt ?? r.CreatedAt ?? '')
                : undefined,
        updatedAt:
            r.updatedAt !== undefined || r.UpdatedAt !== undefined
                ? String(r.updatedAt ?? r.UpdatedAt ?? '')
                : undefined,
    }
}

/** Returns `null` when no active project setting exists (404). */
export const getDoctorCourseProjectSetting = async (
    courseId: number,
): Promise<DoctorCourseProjectSetting | null> => {
    try {
        const response = await api.get(`/courses/${courseId}/project-setting`)
        return mapDoctorCourseProjectSetting(response.data)
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null
        throw err
    }
}

export const upsertDoctorCourseProjectSetting = async (
    courseId: number,
    body: {
        title: string
        description: string
        teamSize: number
        file?: File | null
    },
): Promise<DoctorCourseProjectSetting> => {
    const fd = new FormData()
    fd.append('title', body.title.trim())
    fd.append('description', body.description ?? '')
    fd.append('teamSize', String(body.teamSize))
    if (body.file && body.file.size > 0) {
        fd.append('file', body.file)
    }
    const response = await api.post(
        `/courses/${courseId}/project-setting`,
        fd,
        {
            headers: {
                'Content-Type': false as unknown as string,
            },
        },
    )
    return mapDoctorCourseProjectSetting(response.data)
}

export interface DoctorCourseTeamMember {
    studentId: number
    userId: number
    name: string
    role: string
}

export interface DoctorCourseTeam {
    teamId: number
    courseId: number
    projectSettingId: number
    projectTitle: string
    leaderId: number
    memberCount: number
    createdAt: string
    members: DoctorCourseTeamMember[]
}

function mapDoctorCourseTeamMember(raw: unknown): DoctorCourseTeamMember {
    const r = raw as Record<string, unknown>
    return {
        studentId: Number(r.studentId ?? r.StudentId ?? 0),
        userId: Number(r.userId ?? r.UserId ?? 0),
        name: String(r.name ?? r.Name ?? ''),
        role: String(r.role ?? r.Role ?? 'member'),
    }
}

function mapDoctorCourseTeam(raw: unknown): DoctorCourseTeam {
    const r = raw as Record<string, unknown>
    const membersRaw = r.members ?? r.Members
    const members = Array.isArray(membersRaw)
        ? membersRaw.map(mapDoctorCourseTeamMember)
        : []
    return {
        teamId: Number(r.teamId ?? r.TeamId ?? 0),
        courseId: Number(r.courseId ?? r.CourseId ?? 0),
        projectSettingId: Number(r.projectSettingId ?? r.ProjectSettingId ?? 0),
        projectTitle: String(r.projectTitle ?? r.ProjectTitle ?? ''),
        leaderId: Number(r.leaderId ?? r.LeaderId ?? 0),
        memberCount: Number(r.memberCount ?? r.MemberCount ?? members.length),
        createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
        members,
    }
}

export const getDoctorCourseTeams = async (
    courseId: number,
): Promise<DoctorCourseTeam[]> => {
    const response = await api.get(`/courses/${courseId}/teams`)
    const data = response.data
    if (!Array.isArray(data)) return []
    return data.map(mapDoctorCourseTeam)
}

// ── Course sections (GET/POST /courses/{courseId}/sections, …/sections/{id}/…) ──

export const getDoctorCourseSections = async (
    courseId: number,
): Promise<CourseSection[]> => {
    const response = await api.get(`/courses/${courseId}/sections`)
    const data = response.data
    if (!Array.isArray(data)) return []
    return data.map(mapCourseSection)
}

// ── Course projects (multi-project) GET/POST /courses/{courseId}/projects ──

/** Mirrors CourseProjectSectionDto. */
export interface DoctorCourseProjectSection {
    sectionId: number
    sectionName: string
}

/** Mirrors CourseProjectDto. */
export interface DoctorCourseProject {
    id: number
    courseId: number
    title: string
    description: string | null
    teamSize: number
    applyToAllSections: boolean
    allowCrossSectionTeams: boolean
    aiMode: "doctor" | "student"
    createdAt: string
    sections: DoctorCourseProjectSection[]
}

function mapDoctorCourseProjectSection(raw: unknown): DoctorCourseProjectSection {
    const r = raw as Record<string, unknown>
    return {
        sectionId: Number(r.sectionId ?? r.SectionId ?? 0),
        sectionName: String(r.sectionName ?? r.SectionName ?? ''),
    }
}

function mapDoctorCourseProject(raw: unknown): DoctorCourseProject {
    const r = raw as Record<string, unknown>
    const descRaw = r.description ?? r.Description
    const sectionsRaw = r.sections ?? r.Sections
    return {
        id: Number(r.id ?? r.Id ?? 0),
        courseId: Number(r.courseId ?? r.CourseId ?? 0),
        title: String(r.title ?? r.Title ?? ''),
        description:
            descRaw === undefined || descRaw === null ? null : String(descRaw),
        teamSize: Number(r.teamSize ?? r.TeamSize ?? 2),
        applyToAllSections: Boolean(
            r.applyToAllSections ?? r.ApplyToAllSections ?? false,
        ),
        allowCrossSectionTeams: Boolean(
            r.allowCrossSectionTeams ?? r.AllowCrossSectionTeams ?? false,
        ),
        aiMode: (r.aiMode ?? r.AiMode ?? 'doctor') === 'student' ? 'student' : 'doctor',
        createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
        sections: Array.isArray(sectionsRaw)
            ? sectionsRaw.map(mapDoctorCourseProjectSection)
            : [],
    }
}

export const getDoctorCourseProjects = async (
    courseId: number,
): Promise<DoctorCourseProject[]> => {
    const response = await api.get(`/courses/${courseId}/projects`)
    const data = response.data
    if (!Array.isArray(data)) return []
    return data.map(mapDoctorCourseProject)
}

export interface CreateCourseProjectBody {
    title: string
    description: string
    teamSize: number
    applyToAllSections: boolean
    allowCrossSectionTeams: boolean
    aiMode: "doctor" | "student"
    sectionIds: number[]
}

export const createDoctorCourseProject = async (
    courseId: number,
    body: CreateCourseProjectBody,
): Promise<DoctorCourseProject> => {
    const response = await api.post(`/courses/${courseId}/projects`, {
        title: body.title.trim(),
        description: body.description?.trim() ?? '',
        teamSize: body.teamSize,
        applyToAllSections: body.applyToAllSections,
        allowCrossSectionTeams: body.allowCrossSectionTeams,
        sectionIds: body.sectionIds,
    })
    return mapDoctorCourseProject(response.data)
}

/** Same payload as create — mirrors UpdateCourseProjectDto. */
export type UpdateCourseProjectBody = CreateCourseProjectBody

export const updateDoctorCourseProject = async (
    projectId: number,
    body: UpdateCourseProjectBody,
): Promise<DoctorCourseProject> => {
    const response = await api.put(`/courses/projects/${projectId}`, {
        title: body.title.trim(),
        description: body.description?.trim() ?? '',
        teamSize: body.teamSize,
        applyToAllSections: body.applyToAllSections,
        allowCrossSectionTeams: body.allowCrossSectionTeams,
        sectionIds: body.sectionIds,
    })
    return mapDoctorCourseProject(response.data)
}

export const deleteDoctorCourseProject = async (
    projectId: number,
): Promise<void> => {
    await api.delete(`/courses/projects/${projectId}`)
}

export const createDoctorCourseSection = async (
    courseId: number,
    body: CreateCourseSectionBody,
): Promise<CourseSection> => {
    const response = await api.post(`/courses/${courseId}/sections`, {
        name: body.name.trim(),
        days: body.days,
        timeFrom: body.timeFrom.trim() || null,
        timeTo: body.timeTo.trim() || null,
        capacity: body.capacity,
    })
    return mapCourseSection(response.data)
}

export const getDoctorSectionStudents = async (
    sectionId: number,
): Promise<DoctorCourseStudent[]> => {
    const response = await api.get(`/courses/sections/${sectionId}/students`)
    const data = response.data
    if (!Array.isArray(data)) return []
    return data.map(mapDoctorCourseStudent)
}

export const addStudentsToDoctorSection = async (
    sectionId: number,
    studentIds: string[],
): Promise<void> => {
    await api.post(`/courses/sections/${sectionId}/students`, { studentIds })
}

/** Returns `null` when no active per-section project setting exists (404). */
export const getDoctorSectionProjectSetting = async (
    sectionId: number,
): Promise<SectionProjectSetting | null> => {
    try {
        const response = await api.get(
            `/courses/sections/${sectionId}/project-setting`,
        )
        return mapSectionProjectSetting(response.data)
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null
        throw err
    }
}

export const upsertDoctorSectionProjectSetting = async (
    sectionId: number,
    body: UpsertSectionProjectSettingBody,
): Promise<SectionProjectSetting> => {
    const response = await api.post(
        `/courses/sections/${sectionId}/project-setting`,
        {
            title: body.title.trim(),
            description: body.description?.trim() ?? '',
            teamSize: body.teamSize,
        },
    )
    return mapSectionProjectSetting(response.data)
}