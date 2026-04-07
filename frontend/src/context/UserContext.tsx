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
  refetch: () => void
}

const UserContext = createContext<UserContextType>({
  profile: EMPTY_PROFILE,
  setProfile: () => {},
  updateProfile: () => {},
  loading: false,
  error: null,
  refetch: () => {},
})

// ─── Helper: map API response → UserProfile ───────────────────────────────────

function mapApiToProfile(data: any): UserProfile {
  const mapped: UserProfile = {
    fullName: data.name || data.fullName || '',
    email: data.email || '',
    profilePic: data.profilePictureBase64 || null,
    coverImage: data.coverImage || null,
    studentId: data.studentId || '',
    university: data.university || '',
    faculty: data.faculty || '',
    major: data.major || '',
    academicYear: data.academicYear || '',
    gpa: data.gpa != null ? String(data.gpa) : '',

    roles: data.roles || [],
    technicalSkills: data.technicalSkills || [],
    tools: data.tools || [],

    bio: data.bio || '',
    preferredRole: data.preferredRole || '',
    availability: data.availability || '',
    lookingFor: data.lookingFor || '',
    languages: data.languages || [],

    github: data.github || '',
    linkedin: data.linkedin || '',
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

  const fetchProfile = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await api.get('/me')
      const mapped = mapApiToProfile(res.data)

      setProfileState(mapped)
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
    } finally {
      setLoading(false)
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