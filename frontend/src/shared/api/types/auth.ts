export interface AuthSession {
  token: string
  role: string
  userId: number
  name: string
  email: string
  profileId: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  /** True when the backend SMTP client sent the email successfully. */
  emailSent: boolean
  /** Present in local development when SMTP is missing/failed but a token was created. */
  resetUrl?: string | null
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  confirmPassword: string
}

export interface RegisterDoctorPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  university: string
  faculty: string
  department: string
  specialization: string
  bio?: string
  profilePictureBase64?: string | null
}

export interface RegisterCompanyPayload {
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

export interface RegisterOrganizationPayload {
  associationName: string
  username: string
  email: string
  password: string
  confirmPassword: string
  description?: string
  faculty: string
  category: string
  logoUrl?: string
  instagramUrl?: string
  facebookUrl?: string
  linkedInUrl?: string
}

export interface RegisterStudentPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  profilePictureBase64?: string | null
  studentId: string
  university: string
  faculty: string
  major: string
  academicYear: string
  gpa?: number | null
  roles: string[]
  technicalSkills: string[]
  tools: string[]
  generalSkills: string[]
  majorSkills: string[]
}

export interface CompanyAnalysisResult {
  companyName: string
  industry?: string
  description?: string
  location?: string
  usedAi: boolean
  message?: string
}
