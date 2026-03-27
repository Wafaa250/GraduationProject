import api from './axiosInstance'

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

export interface DashboardSummary {
  name: string
  major: string
  university: string
  academicYear: string
  totalSkills: number
  profileStrength: ProfileStrength
  suggestedTeammates: SuggestedTeammate[]
}

// ─── API Calls ────────────────────────────────────────────────────────────────

// جلب ملخص الداشبورد كامل
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get('/dashboard/summary')
  return response.data
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
