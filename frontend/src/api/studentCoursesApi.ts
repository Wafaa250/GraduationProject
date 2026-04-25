import api from './axiosInstance'
import type { CourseSection } from './doctorCoursesApi'

/**
 * Shared lightweight entity for student identity fields commonly returned by
 * course/team/partner-request endpoints.
 * GET /courses/{id}/students may use PascalCase (StudentId, UserId, …).
 */
export interface CourseStudent {
  studentId?: number
  StudentId?: number
  universityId?: string
  UniversityId?: string
  userId?: number
  UserId?: number
  name?: string
  Name?: string
  email?: string
  Email?: string
  university?: string
  University?: string
  major?: string
  Major?: string
  academicYear?: string
  AcademicYear?: string
  profilePicture?: string | null
  ProfilePictureBase64?: string | null
  enrolledAt?: string
  EnrolledAt?: string
  sectionId?: number | null
  SectionId?: number | null
  sectionNumber?: number | null
  SectionNumber?: number | null
}

export interface EnrolledCourse {
  courseId: number
  name?: string
  code?: string
  section?: string
  semester?: string | null
  useSharedProjectAcrossSections?: boolean
  allowCrossSectionTeams?: boolean
  doctorId?: number
  doctorName?: string
  sectionCount?: number
  sections?: CourseSection[]
}

/** Mirrors course `projects` entries on GET /courses/{id} (same shape as doctor course projects). */
export interface CourseProjectSummary {
  id: number
  courseId: number
  title: string
  description: string | null
  teamSize: number
  applyToAllSections: boolean
  allowCrossSectionTeams: boolean
  createdAt: string
  sections: { sectionId: number; sectionNumber: number }[]
}

function mapCourseProjectSection(raw: unknown): {
  sectionId: number
  sectionNumber: number
} {
  const r = raw as Record<string, unknown>
  return {
    sectionId: Number(r.sectionId ?? r.SectionId ?? 0),
    sectionNumber: Number(r.sectionNumber ?? r.SectionNumber ?? 0),
  }
}

function mapCourseProjectSummary(raw: unknown): CourseProjectSummary {
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
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    sections: Array.isArray(sectionsRaw)
      ? sectionsRaw.map(mapCourseProjectSection)
      : [],
  }
}

/** Reads `projects` / `Projects` from course detail (defensive for PascalCase). */
export function normalizeCourseProjectsFromDetail(
  detail: CourseDetails | null | undefined,
): CourseProjectSummary[] {
  if (!detail) return []
  const raw = (detail as Record<string, unknown>).projects ??
    (detail as Record<string, unknown>).Projects
  if (!Array.isArray(raw)) return []
  return raw.map(mapCourseProjectSummary).filter((p) => p.id > 0)
}

export interface CourseDetails {
  courseId: number
  name?: string
  code?: string
  section?: string
  semester?: string | null
  useSharedProjectAcrossSections?: boolean
  allowCrossSectionTeams?: boolean
  doctorId?: number
  doctorName?: string
  sectionCount?: number
  sections?: CourseSection[]
  projects?: CourseProjectSummary[]
  projectsCount?: number
  [key: string]: unknown
}

export interface CourseProjectSetting {
  [key: string]: unknown
}

export interface TeamMember {
  studentId: number
  universityId: string
  userId?: number
  name?: string
  email?: string
  role?: string
}

export interface MyTeamResponse {
  teamId: number
  members: TeamMember[]
  [key: string]: unknown
}

export interface PartnerRequest {
  requestId: number
  senderStudentId?: number
  receiverStudentId?: number
  senderUniversityId?: string
  receiverUniversityId?: string
  /** Always set by GET partner-requests: pending | accepted | rejected | cancelled */
  status?: string
  createdAt?: string
  sender?: CourseStudent
  receiver?: CourseStudent
  [key: string]: unknown
}

export interface PartnerRequestsResponse {
  incoming: PartnerRequest[]
  outgoing: PartnerRequest[]
}

export interface CreatePartnerRequestBody {
  /** Must be the UNIVERSITY student id string (not database PK). */
  receiverStudentId: string
  /** When the course has multiple projects, the backend may require this. */
  courseProjectId?: number
}

export type RecommendedPartnerMode = 'complementary' | 'similar'

export interface RecommendedPartner {
  studentId: number
  userId?: number
  name?: string
  skills?: string[]
  matchScore?: number
  reason?: string
}

export interface StudentViewCourse {
  id: number
  name: string
  code: string
  semester?: string | null
  doctorName?: string
}

export interface StudentViewSection {
  id: number
  name: string
  schedule?: string
  capacity?: number
}

export interface StudentViewStudent {
  id: number
  name: string
  email?: string
  sectionId: number
}

export interface StudentViewProject {
  id: number
  title: string
  description?: string | null
  applyToAllSections: boolean
  sectionIds: number[]
}

export interface StudentCourseView {
  course: StudentViewCourse
  mySection: StudentViewSection | null
  students: StudentViewStudent[]
  projects: StudentViewProject[]
}

export const getEnrolledCourses = async (): Promise<EnrolledCourse[]> => {
  const response = await api.get('/courses/enrolled')
  return response.data
}

export const getCourseById = async (courseId: number): Promise<CourseDetails> => {
  const response = await api.get(`/courses/${courseId}`)
  return response.data
}

export const getCourseStudentView = async (
  courseId: number,
): Promise<StudentCourseView> => {
  const response = await api.get(`/courses/${courseId}/student-view`)
  return response.data
}

export const getCourseStudents = async (courseId: number): Promise<CourseStudent[]> => {
  const response = await api.get(`/courses/${courseId}/students`)
  return response.data
}

export const getCourseProjectSetting = async (
  courseId: number,
): Promise<CourseProjectSetting> => {
  const response = await api.get(`/courses/${courseId}/project-setting`)
  return response.data
}

export const getCoursePartnerRequests = async (
  courseId: number,
): Promise<PartnerRequestsResponse> => {
  const response = await api.get(`/courses/${courseId}/partner-requests`)
  return response.data
}

export const getRecommendedPartners = async (
  courseId: number,
  mode: RecommendedPartnerMode,
): Promise<RecommendedPartner[]> => {
  const response = await api.get(
    `/courses/${courseId}/recommended-partners`,
    { params: { mode } },
  )
  return response.data
}

/**
 * Backend behavior: returns null if the current student has no team yet.
 */
export const getMyTeam = async (courseId: number): Promise<MyTeamResponse | null> => {
  const response = await api.get(`/courses/${courseId}/my-team`)
  return response.data
}

export const createPartnerRequest = async (
  courseId: number,
  body: CreatePartnerRequestBody,
): Promise<void> => {
  await api.post(`/courses/${courseId}/partner-requests`, body)
}

export const acceptPartnerRequest = async (
  courseId: number,
  requestId: number,
): Promise<void> => {
  await api.post(`/courses/${courseId}/partner-requests/${requestId}/accept`)
}

export const rejectPartnerRequest = async (
  courseId: number,
  requestId: number,
): Promise<void> => {
  await api.post(`/courses/${courseId}/partner-requests/${requestId}/reject`)
}

export const removeTeamMember = async (
  courseId: number,
  teamId: number,
  studentId: number,
): Promise<void> => {
  await api.delete(`/courses/${courseId}/teams/${teamId}/members/${studentId}`)
}

/** Student leaves the course (removes enrollment and team membership per backend). */
export const leaveCourse = async (courseId: number): Promise<void> => {
  await api.post(`/courses/${courseId}/leave`)
}
