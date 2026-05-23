import { apiClient } from './client'
import type {
  AuthSession,
  CompanyAnalysisResult,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterCompanyPayload,
  RegisterDoctorPayload,
  RegisterOrganizationPayload,
  RegisterStudentPayload,
  ResetPasswordPayload,
} from './types/auth'

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthSession>('/auth/login', payload).then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<{ message: string }>('/auth/reset-password', payload).then((r) => r.data),

  registerStudent: (payload: RegisterStudentPayload) =>
    apiClient.post<AuthSession>('/auth/register/student', payload).then((r) => r.data),

  registerDoctor: (payload: RegisterDoctorPayload) =>
    apiClient.post<AuthSession>('/auth/register/doctor', payload).then((r) => r.data),

  registerCompany: (payload: RegisterCompanyPayload) =>
    apiClient.post<AuthSession>('/auth/register/company', payload).then((r) => r.data),

  registerOrganization: (payload: RegisterOrganizationPayload) =>
    apiClient.post<AuthSession>('/auth/register/association', payload).then((r) => r.data),

  analyzeCompany: (payload: { websiteUrl?: string; linkedInUrl?: string }) =>
    apiClient.post<CompanyAnalysisResult>('/auth/company/analyze', payload).then((r) => r.data),
}
