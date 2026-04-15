import api from './axiosInstance'

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
}

export interface EnrolledCourse {
  courseId: number
  name?: string
  code?: string
  section?: string
  semester?: string
}

export interface CourseDetails {
  courseId: number
  name?: string
  code?: string
  section?: string
  semester?: string
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
}

export const getEnrolledCourses = async (): Promise<EnrolledCourse[]> => {
  const response = await api.get('/courses/enrolled')
  return response.data
}

export const getCourseById = async (courseId: number): Promise<CourseDetails> => {
  const response = await api.get(`/courses/${courseId}`)
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
