/** GET /api/me — student branch (camelCase from ASP.NET JSON) */

export interface StudentMe {
  role: 'student'
  userId: number
  profileId: number
  name: string
  email: string
  studentId: string
  university: string | null
  faculty: string | null
  major: string | null
  academicYear: string | null
  gpa: number | null
  bio: string | null
  availability: string | null
  lookingFor: string | null
  github: string | null
  linkedin: string | null
  portfolio: string | null
  profilePictureBase64: string | null
  languages: string[]
  roles: string[]
  technicalSkills: string[]
  tools: string[]
  generalSkills: string[]
  majorSkills: string[]
}

export function isStudentMe(data: unknown): data is StudentMe {
  return (
    typeof data === 'object' &&
    data !== null &&
    'role' in data &&
    (data as { role: string }).role === 'student'
  )
}
