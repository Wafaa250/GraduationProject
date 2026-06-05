import api, { parseApiErrorMessage } from "./axiosInstance";
import type { AuthLoginResponse } from "@/types/auth";

export type CompanyAnalysisResult = {
  companyName: string;
  industry?: string | null;
  description?: string | null;
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
  websiteUrl?: string;
  linkedInUrl?: string;
};

export async function analyzeCompany(payload: {
  websiteUrl?: string;
  linkedInUrl?: string;
}): Promise<CompanyAnalysisResult> {
  const { data } = await api.post<CompanyAnalysisResult>("/auth/company/analyze", payload);
  return data;
}

export async function registerCompany(payload: RegisterCompanyPayload): Promise<AuthLoginResponse> {
  const { data } = await api.post<AuthLoginResponse>("/auth/register/company", payload);
  return data;
}

export { parseApiErrorMessage };
