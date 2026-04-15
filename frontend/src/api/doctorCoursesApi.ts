import axios from 'axios'
import api from './axiosInstance'

export interface DoctorCourse {
  courseId: number
  name: string
  code: string
  createdAt: string
}

export interface CreateCourseBody {
  name: string
  code: string
}

function mapDoctorCourse(raw: unknown): DoctorCourse {
  const r = raw as Record<string, unknown>
  const id = r.courseId ?? r.CourseId ?? r.id ?? r.Id
  return {
    courseId: Number(id ?? 0),
    name: String(r.name ?? r.Name ?? ''),
    code: String(r.code ?? r.Code ?? ''),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
  }
}

export interface DoctorCourseDetail {
  id: number
  name: string
  code: string
  studentCount: number
  teamCount: number
  createdAt: string
}

export interface DoctorCourseStudent {
  studentId: number
  userId: number
  name: string
  university: string
  major: string
}

function mapDoctorCourseDetail(raw: unknown): DoctorCourseDetail {
  const r = raw as Record<string, unknown>
  return {
    id: Number(r.id ?? r.Id ?? 0),
    name: String(r.name ?? r.Name ?? ''),
    code: String(r.code ?? r.Code ?? ''),
    studentCount: Number(r.studentCount ?? r.StudentCount ?? 0),
    teamCount: Number(r.teamCount ?? r.TeamCount ?? 0),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
  }
}

function mapDoctorCourseStudent(raw: unknown): DoctorCourseStudent {
  const r = raw as Record<string, unknown>
  return {
    studentId: Number(r.studentId ?? r.StudentId ?? 0),
    userId: Number(r.userId ?? r.UserId ?? 0),
    name: String(r.name ?? r.Name ?? ''),
    university: String(r.university ?? r.University ?? ''),
    major: String(r.major ?? r.Major ?? ''),
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
