import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkillItem {
  id: string
  label: string
  icon: string
}

export interface UserProfile {
  // Account
  fullName: string
  email: string
  profilePic: string | null
  coverImage: string | null

  // Student Info
  studentId: string
  university: string
  faculty: string
  major: string

  // Academic
  academicYear: string
  gpa: string

  // Skills (NEW SYSTEM)
  roles: string[]
  technicalSkills: string[]
  /** Doctor profile only; empty for students */
  researchSkills: string[]
  tools: string[]

  // Work style
  bio: string
  preferredRole: string
  availability: string
  lookingFor: string
  languages: string[]

  // Links
  github: string
  linkedin: string
  portfolio: string

  // Meta
  isOwnProfile: boolean
  completeness: number

  // Auth
  role: string
}

// ─── Default empty profile ────────────────────────────────────────────────────

export const EMPTY_PROFILE: UserProfile = {
  fullName: '',
  email: '',
  profilePic: null,
  coverImage: null,
  studentId: '',
  university: '',
  faculty: '',
  major: '',
  academicYear: '',
  gpa: '',
  roles: [],
  technicalSkills: [],
  researchSkills: [],
  tools: [],
  bio: '',
  preferredRole: '',
  availability: '',
  lookingFor: '',
  languages: [],
  github: '',
  linkedin: '',
  portfolio: '',
  isOwnProfile: true,
  completeness: 0,
  role: '',
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface UserContextType {
  profile: UserProfile
  setProfile: (p: UserProfile) => void
  updateProfile: (partial: Partial<UserProfile>) => void
  loading: boolean
  error: string | null
  refetch: (silent?: boolean) => Promise<any | null>
}

const UserContext = createContext<UserContextType>({
  profile: EMPTY_PROFILE,
  setProfile: () => {},
  updateProfile: () => {},
  loading: false,
  error: null,
  refetch: async (_silent?: boolean) => null,
})

// ─── Skills: API may return string[], objects, or a comma-separated string ───

export function normalizeSkillStringList(raw: unknown): string[] {
  if (raw == null) return []
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
  if (!Array.isArray(raw)) return []
  return raw
    .map((item: unknown) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        const s = o.label ?? o.name ?? o.skill ?? o.title
        return s != null ? String(s).trim() : ''
      }
      return String(item).trim()
    })
    .filter(Boolean)
}

/** Doctor UI: merged skills for display — never use backend `skills` (merged). */
export function mergeDoctorSkillsFromLists(
  technicalSkills: string[] | undefined,
  researchSkills: string[] | undefined,
): string[] {
  return [...(technicalSkills || []), ...(researchSkills || [])]
}

// ─── Helper: map API response → UserProfile ───────────────────────────────────

function mapApiToProfile(data: any): UserProfile {
  const isDoctor = String(data.role || '').toLowerCase() === 'doctor'
  const doctorProfile = data?.doctorProfile ?? data?.DoctorProfile ?? {}

  const roles = isDoctor ? [] : normalizeSkillStringList(data.roles ?? data.generalSkills)
  const technicalSkills = isDoctor
    ? normalizeSkillStringList(
        doctorProfile.technicalSkills ??
          doctorProfile.TechnicalSkills ??
          data.technicalSkills ??
          data.TechnicalSkills,
      )
    : normalizeSkillStringList(data.technicalSkills ?? data.majorSkills)
  const researchSkills = isDoctor
    ? normalizeSkillStringList(
        doctorProfile.researchSkills ?? doctorProfile.ResearchSkills ?? data.researchSkills ?? data.ResearchSkills,
      )
    : []
  const tools = isDoctor ? [] : normalizeSkillStringList(data.tools)

  const mapped: UserProfile = {
    fullName: isDoctor
      ? data.user?.name || data.user?.fullName || data.name || data.fullName || ''
      : data.name || data.fullName || '',
    email: isDoctor ? data.user?.email || data.email || '' : data.email || '',
    profilePic: isDoctor
      ? data.user?.profilePictureBase64 ?? doctorProfile.profilePictureBase64 ?? data.profilePictureBase64 ?? null
      : data.profilePictureBase64 || null,
    coverImage: data.coverImage || null,
    studentId: data.studentId || '',
    university: isDoctor
      ? (doctorProfile.university ?? doctorProfile.University ?? data.university) || ''
      : data.university || '',
    faculty: isDoctor
      ? (doctorProfile.faculty ?? doctorProfile.Faculty ?? data.faculty) || ''
      : data.faculty || '',
    major: data.major || '',
    academicYear: data.academicYear || '',
    gpa: data.gpa != null ? String(data.gpa) : '',

    roles,
    technicalSkills,
    researchSkills,
    tools,

    bio: isDoctor ? (doctorProfile.bio ?? data.bio) || '' : data.bio || '',
    preferredRole: data.preferredRole || '',
    availability: data.availability || '',
    lookingFor: data.lookingFor || '',
    languages: data.languages || [],

    github: data.github || '',
    linkedin: isDoctor
      ? (doctorProfile.linkedin ?? doctorProfile.Linkedin ?? data.linkedin) || ''
      : data.linkedin || '',
    portfolio: data.portfolio || '',

    isOwnProfile: true,
    completeness: 0,
    role: data.role || localStorage.getItem('role') || '',
  }

  mapped.completeness = calcCompleteness(mapped)
  return mapped
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (silent = false) => {
    const token = localStorage.getItem('token')
    if (!token) {
      if (!silent) setLoading(false)
      return null
    }

    try {
      if (!silent) setLoading(true)
      setError(null)

      const res = await api.get('/me')
      const mapped = mapApiToProfile(res.data)

      setProfileState(mapped)
      return res.data
    } catch (err: any) {
      setError('Failed to load profile')

      const name = localStorage.getItem('name') || ''
      const email = localStorage.getItem('email') || ''

      if (name || email) {
        setProfileState(prev => ({
          ...prev,
          fullName: name,
          email
        }))
      }
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const setProfile = (p: UserProfile) => {
    const withScore = {
      ...p,
      completeness: calcCompleteness(p)
    }

    setProfileState(withScore)
  }

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfileState(prev => {
      const updated = { ...prev, ...partial }
      updated.completeness = calcCompleteness(updated)
      return updated
    })
  }

  return (
    <UserContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        loading,
        error,
        refetch: fetchProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUser() {
  return useContext(UserContext)
}

// ─── Completeness calculator ──────────────────────────────────────────────────

export function calcCompleteness(p: UserProfile): number {
  const checks = [
    !!p.fullName,
    !!p.profilePic,
    !!p.bio,
    p.roles.length > 0,
    p.technicalSkills.length > 0,
    p.tools.length > 0,
    !!p.github || !!p.linkedin || !!p.portfolio,
    !!p.preferredRole,
    !!p.lookingFor,
    p.languages.length > 0,
  ]

  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}