import api, { parseApiErrorMessage } from "./axiosInstance";

export type CompanyAnalysisResult = {
  companyName: string;
  industry?: string | null;
  description?: string | null;
  location?: string | null;
  usedAi: boolean;
  message?: string | null;
};

export type RegisterCompanyPayload = {
  contactName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  industry?: string;
  description?: string;
  location?: string;
  websiteUrl?: string;
  linkedInUrl?: string;
};

export type AuthResponse = {
  token: string;
  role: string;
  userId: number;
  name: string;
  email: string;
  profileId: number;
};

export async function analyzeCompany(payload: {
  websiteUrl?: string;
  linkedInUrl?: string;
}): Promise<CompanyAnalysisResult> {
  const { data } = await api.post<CompanyAnalysisResult>("/auth/company/analyze", payload);
  return data;
}

export async function registerCompany(payload: RegisterCompanyPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/company", payload);
  return data;
}

export { parseApiErrorMessage };
