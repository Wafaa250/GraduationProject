import { createContext, useContext, useState, ReactNode } from 'react'

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
  gpa: string          // empty string = الطالب ما حط GPA

  // Skills (ids — يُحوّل لـ label+icon عند العرض)
  generalSkills: string[]
  majorSkills: string[]

  // Work style (تتعبى بالـ EditProfile)
  bio: string
  preferredRole: string
  availability: string
  lookingFor: string
  languages: string[]
  tools: string[]

  // Links
  github: string
  linkedin: string
  portfolio: string

  // Meta
  isOwnProfile: boolean
  completeness: number
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
  gpa: '',             // فاضي = مخفي
  generalSkills: [],
  majorSkills: [],
  bio: '',
  preferredRole: '',
  availability: '',
  lookingFor: '',
  languages: [],
  tools: [],
  github: '',
  linkedin: '',
  portfolio: '',
  isOwnProfile: true,
  completeness: 0,
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface UserContextType {
  profile: UserProfile
  setProfile: (p: UserProfile) => void
  updateProfile: (partial: Partial<UserProfile>) => void
}

const UserContext = createContext<UserContextType>({
  profile: EMPTY_PROFILE,
  setProfile: () => {},
  updateProfile: () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE)

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...partial }
      updated.completeness = calcCompleteness(updated)
      return updated
    })
  }

  return (
    <UserContext.Provider value={{ profile, setProfile, updateProfile }}>
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
    p.generalSkills.length > 0,
    p.majorSkills.length > 0,
    !!p.github || !!p.linkedin || !!p.portfolio,
    !!p.preferredRole,
    !!p.lookingFor,
    p.tools.length > 0,
    p.languages.length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}