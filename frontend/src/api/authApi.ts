import api from './axiosInstance'

export interface RegisterStudentPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  profilePictureBase64: string | null
  studentId: string
  university: string
  faculty: string
  major: string
  academicYear: string
  gpa: number | null
  generalSkills: string[]
  majorSkills: string[]
}

export const registerStudent = async (data: RegisterStudentPayload) => {
  const response = await api.post('/auth/register/student', data)
  return response.data // RegisterStudentResponseDto
}

export type MessageResponse = {
  message: string
}

export type AuthResponse = {
  token: string
  role: string
  userId: number
  name: string
  email: string
  profileId: number
  isNewUser?: boolean
}

export type GoogleAuthRole = 'student' | 'doctor' | 'company' | 'association'

export const loginWithGoogle = async (
  idToken: string,
  role?: GoogleAuthRole,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/google', {
    idToken,
    role: role ?? undefined,
  })
  return response.data
}

export const requestPasswordReset = async (email: string): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/auth/forgot-password', { email })
  return response.data
}

export const resetPassword = async (payload: {
  token: string
  password: string
  confirmPassword: string
}): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/auth/reset-password', payload)
  return response.data
}
