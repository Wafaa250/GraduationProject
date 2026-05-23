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

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  confirmPassword: string
}

export interface MessageResponse {
  message: string
}

export const forgotPassword = async (data: ForgotPasswordPayload) => {
  const response = await api.post<MessageResponse>('/auth/forgot-password', data)
  return response.data
}

export const resetPassword = async (data: ResetPasswordPayload) => {
  const response = await api.post<MessageResponse>('/auth/reset-password', data)
  return response.data
}