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