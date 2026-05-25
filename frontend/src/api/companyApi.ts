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

export type CompanyProfile = {
  id: number;
  userId: number;
  companyName: string;
  industry?: string | null;
  description?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  email: string;
};

export type CompanyTalentSearchPayload = {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredMajor?: string;
  engagementType?: string;
  duration?: string;
  saveRequest?: boolean;
};

export type CompanyTalentCandidate = {
  studentProfileId: number;
  userId: number;
  name: string;
  major: string;
  university: string;
  academicYear?: string | null;
  bio?: string | null;
  skills: string[];
  matchScore: number;
  reason: string;
  highlights: string[];
};

export type CompanyTalentSearchResult = {
  requestId?: number | null;
  title: string;
  usedAi: boolean;
  candidates: CompanyTalentCandidate[];
};

export type CompanyTalentRequestSummary = {
  id: number;
  title: string;
  engagementType?: string | null;
  requiredSkills: string[];
  createdAt: string;
};

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const { data } = await api.get<CompanyProfile>("/company/profile");
  return data;
}

export async function searchCompanyTalent(
  payload: CompanyTalentSearchPayload,
): Promise<CompanyTalentSearchResult> {
  const { data } = await api.post<CompanyTalentSearchResult>("/company/talent-search", payload);
  return data;
}

export async function listCompanyTalentRequests(): Promise<CompanyTalentRequestSummary[]> {
  const { data } = await api.get<CompanyTalentRequestSummary[]>("/company/talent-requests");
  return data;
}

// ── Company project requests (wizard) ─────────────────────────────────────

export type CompanyRequestType = "individual" | "ai-built-team";

export type CompanyRequestRoleInput = {
  clientRoleKey?: string | null;
  roleName: string;
  skills: string[];
  notes?: string | null;
  sortOrder: number;
};

export type CompanyRequestRoleDetail = {
  id: number;
  clientRoleKey?: string | null;
  sortOrder: number;
  roleName: string;
  notes?: string | null;
  skills: { id: number; skillName: string; sortOrder: number }[];
};

export type SaveCompanyRequestDraftPayload = {
  wizardStep: number;
  requestType?: string | null;
  title: string;
  description: string;
  categoryChoice: string;
  categoryOther: string;
  targetRole?: string | null;
  requiredSkills: string[];
  roles: CompanyRequestRoleInput[];
  durationOngoing: boolean;
  durationValue?: number | null;
  durationUnit?: string | null;
  collaborationType: string;
  scopeNotes?: string | null;
};

export type CreateCompanyProjectRequestPayload = SaveCompanyRequestDraftPayload & {
  requestType: string;
};

export type CompanyProjectRequestSummary = {
  id: number;
  requestType: CompanyRequestType | string;
  status: string;
  title: string;
  category: string;
  durationLabel?: string | null;
  collaborationType: string;
  roleNames: string[];
  skillNames: string[];
  createdAt: string;
  submittedAt?: string | null;
};

export type CompanyProjectRequestDetail = CompanyProjectRequestSummary & {
  wizardStep?: number | null;
  description: string;
  categoryChoice?: string | null;
  categoryOther?: string | null;
  durationOngoing: boolean;
  durationValue?: number | null;
  durationUnit?: string | null;
  scopeNotes?: string | null;
  matchingStatus?: string | null;
  matchedAt?: string | null;
  roles: CompanyRequestRoleDetail[];
  updatedAt: string;
};

export async function getCompanyRequestDraft(): Promise<CompanyProjectRequestDetail | null> {
  const { status, data } = await api.get<CompanyProjectRequestDetail>("/company/requests/draft", {
    validateStatus: (s) => s === 200 || s === 204,
  });
  if (status === 204 || !data) return null;
  return data;
}

export async function saveCompanyRequestDraft(
  payload: SaveCompanyRequestDraftPayload,
): Promise<CompanyProjectRequestDetail> {
  const { data } = await api.put<CompanyProjectRequestDetail>("/company/requests/draft", payload);
  return data;
}

export async function deleteCompanyRequestDraft(): Promise<void> {
  await api.delete("/company/requests/draft");
}

export async function createCompanyProjectRequest(
  payload: CreateCompanyProjectRequestPayload,
): Promise<CompanyProjectRequestDetail> {
  const { data } = await api.post<CompanyProjectRequestDetail>("/company/requests", payload);
  return data;
}

export async function listCompanyProjectRequests(
  includeDraft = false,
): Promise<CompanyProjectRequestSummary[]> {
  const { data } = await api.get<CompanyProjectRequestSummary[]>("/company/requests", {
    params: { includeDraft },
  });
  return data;
}

export async function getCompanyProjectRequest(
  id: number,
): Promise<CompanyProjectRequestDetail> {
  const { data } = await api.get<CompanyProjectRequestDetail>(`/company/requests/${id}`);
  return data;
}

export async function updateCompanyProjectRequestStatus(
  id: number,
  status: string,
): Promise<CompanyProjectRequestDetail> {
  const { data } = await api.patch<CompanyProjectRequestDetail>(
    `/company/requests/${id}/status`,
    { status },
  );
  return data;
}

export async function updateCompanyProjectRequest(
  id: number,
  payload: CreateCompanyProjectRequestPayload,
): Promise<CompanyProjectRequestDetail> {
  const { data } = await api.put<CompanyProjectRequestDetail>(
    `/company/requests/${id}`,
    payload,
  );
  return data;
}

export async function deleteCompanyProjectRequest(id: number): Promise<void> {
  await api.delete(`/company/requests/${id}`);
}

export { parseApiErrorMessage };
