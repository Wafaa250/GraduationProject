import api, { parseApiErrorMessage } from './axiosInstance'

export type CompanyAnalysisResult = {
  companyName: string
  industry?: string | null
  description?: string | null
  location?: string | null
  usedAi: boolean
  message?: string | null
}

export type RegisterCompanyPayload = {
  contactName: string
  email: string
  password: string
  confirmPassword: string
  companyName: string
  industry?: string
  description?: string
  location?: string
  websiteUrl?: string
  linkedInUrl?: string
}

export type AuthResponse = {
  token: string
  role: string
  userId: number
  name: string
  email: string
  profileId: number
}

export async function analyzeCompany(payload: {
  websiteUrl?: string
  linkedInUrl?: string
}): Promise<CompanyAnalysisResult> {
  const { data } = await api.post<CompanyAnalysisResult>('/auth/company/analyze', payload)
  return data
}

export async function registerCompany(payload: RegisterCompanyPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register/company', payload)
  return data
}

export type CompanyProfile = {
  id: number
  userId: number
  companyName: string
  industry?: string | null
  description?: string | null
  location?: string | null
  websiteUrl?: string | null
  linkedInUrl?: string | null
  email: string
}

export type CompanyTalentSearchPayload = {
  title: string
  description: string
  requiredSkills: string[]
  preferredMajor?: string
  engagementType?: string
  duration?: string
  saveRequest?: boolean
}

export type CompanyTalentCandidate = {
  studentProfileId: number
  userId: number
  name: string
  major: string
  university: string
  academicYear?: string | null
  bio?: string | null
  skills: string[]
  matchScore: number
  reason: string
  highlights: string[]
}

export type CompanyTalentSearchResult = {
  requestId?: number | null
  title: string
  usedAi: boolean
  candidates: CompanyTalentCandidate[]
}

export type CompanyTalentRequestSummary = {
  id: number
  title: string
  engagementType?: string | null
  requiredSkills: string[]
  createdAt: string
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const { data } = await api.get<CompanyProfile>('/company/profile')
  return data
}

export async function searchCompanyTalent(
  payload: CompanyTalentSearchPayload,
): Promise<CompanyTalentSearchResult> {
  const { data } = await api.post<CompanyTalentSearchResult>('/company/talent-search', payload)
  return data
}

export async function listCompanyTalentRequests(): Promise<CompanyTalentRequestSummary[]> {
  const { data } = await api.get<CompanyTalentRequestSummary[]>('/company/talent-requests')
  return data
}

export { parseApiErrorMessage }
