// src/api/graduationProjectApi.ts
import api from './axiosInstance'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GradProjectMember {
  studentId:      number
  userId:         number
  name:           string
  email:          string
  university:     string
  major:          string
  profilePicture: string | null
  joinedAt:       string
}

export interface GradProject {
  id:             number
  ownerId:        number   // StudentProfile.Id
  ownerUserId:    number
  ownerName:      string
  name:           string
  description:    string | null
  requiredSkills: string[]
  partnersCount:  number
  currentMembers: number
  isFull:         boolean
  members:        GradProjectMember[]
  createdAt:      string
  updatedAt:      string
}

export interface MyGradProjectResponse {
  role:    'owner' | 'member' | null
  project: GradProject | null
}

export interface CreateGradProjectPayload {
  name:           string
  description?:   string
  requiredSkills: string[]
  partnersCount:  number
}

export interface UpdateGradProjectPayload {
  name?:           string
  description?:    string
  requiredSkills?: string[]
  partnersCount?:  number
}

// ── API calls ─────────────────────────────────────────────────────────────────

// جلب مشروع الطالب الحالي (owner أو member)
export const getMyGradProject = async (): Promise<MyGradProjectResponse> => {
  const res = await api.get('/graduation-projects/my')
  return res.data
}

// إنشاء مشروع جديد
export const createGradProject = async (
  payload: CreateGradProjectPayload
): Promise<GradProject> => {
  const res = await api.post('/graduation-projects', payload)
  return res.data
}

// تعديل مشروع
export const updateGradProject = async (
  id: number,
  payload: UpdateGradProjectPayload
): Promise<GradProject> => {
  const res = await api.put(`/graduation-projects/${id}`, payload)
  return res.data
}

// حذف مشروع
export const deleteGradProject = async (id: number): Promise<void> => {
  await api.delete(`/graduation-projects/${id}`)
}

// الانضمام لمشروع كـ partner
export const joinGradProject = async (id: number): Promise<void> => {
  await api.post(`/graduation-projects/${id}/join`)
}

// مغادرة مشروع
export const leaveGradProject = async (id: number): Promise<void> => {
  await api.delete(`/graduation-projects/${id}/leave`)
}
