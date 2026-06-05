import api, { parseApiErrorMessage } from "./axiosInstance";

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

export type AuthResponse = {
  token: string;
  role: string;
  userId: number;
  name: string;
  email: string;
  profileId: number;
  companyRole?: string | null;
  mustChangePassword?: boolean;
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
  headquartersLocation?: string | null;
  workingStyle?: string | null;
  areasOfInterest: string[];
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  email: string;
  contactEmail?: string | null;
  optionalContactLink?: string | null;
  workspaceRole?: string;
};

export type UpdateCompanyProfilePayload = {
  companyName: string;
  description?: string | null;
  industry?: string | null;
  headquartersLocation?: string | null;
  workingStyle?: string | null;
  areasOfInterest?: string[];
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  contactEmail?: string | null;
  optionalContactLink?: string | null;
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

/** Read-only company profile for visitors (public discovery API). */
export async function getCompanyProfileById(companyProfileId: number): Promise<CompanyProfile> {
  const { data } = await api.get<Record<string, unknown>>(
    `/companies/${companyProfileId}/profile`,
  );
  return {
    id: Number(data.id ?? data.Id ?? companyProfileId),
    userId: Number(data.userId ?? data.UserId ?? 0),
    companyName: String(data.companyName ?? data.CompanyName ?? ""),
    industry: (data.industry ?? data.Industry) as string | null | undefined,
    description: (data.description ?? data.Description) as string | null | undefined,
    location: (data.location ?? data.Location) as string | null | undefined,
    headquartersLocation: (data.headquartersLocation ?? data.HeadquartersLocation) as
      | string
      | null
      | undefined,
    workingStyle: (data.workingStyle ?? data.WorkingStyle) as string | null | undefined,
    areasOfInterest: Array.isArray(data.areasOfInterest ?? data.AreasOfInterest)
      ? ((data.areasOfInterest ?? data.AreasOfInterest) as string[])
      : [],
    websiteUrl: (data.websiteUrl ?? data.WebsiteUrl) as string | null | undefined,
    linkedInUrl: (data.linkedInUrl ?? data.LinkedInUrl) as string | null | undefined,
    email: String(data.email ?? data.Email ?? data.contactEmail ?? data.ContactEmail ?? ""),
    contactEmail: (data.contactEmail ?? data.ContactEmail) as string | null | undefined,
    optionalContactLink: (data.optionalContactLink ?? data.OptionalContactLink) as
      | string
      | null
      | undefined,
    workspaceRole: undefined,
  };
}

export async function updateCompanyProfile(
  payload: UpdateCompanyProfilePayload,
): Promise<CompanyProfile> {
  const { data } = await api.put<CompanyProfile>("/company/profile", payload);
  return data;
}

export type CompanyMember = {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type AddCompanyMemberPayload = {
  fullName: string;
  email: string;
  role: "owner" | "member";
};

export type AddCompanyMemberResponse = {
  member: CompanyMember;
  credentialsEmailSent: boolean;
};

export async function listCompanyMembers(): Promise<CompanyMember[]> {
  const { data } = await api.get<CompanyMember[]>("/company/members");
  return data;
}

export async function addCompanyMember(
  payload: AddCompanyMemberPayload,
): Promise<AddCompanyMemberResponse> {
  const { data } = await api.post<AddCompanyMemberResponse>("/company/members", payload);
  return data;
}

export async function removeCompanyMember(memberId: number): Promise<void> {
  await api.delete(`/company/members/${memberId}`);
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

export type CompanyRequestLifecycleStatus = "active" | "paused" | "closed";

export type CompanyProjectRequestSummary = {
  id: number;
  requestType: CompanyRequestType | string;
  status: string;
  requestStatus: string;
  title: string;
  category: string;
  durationLabel?: string | null;
  collaborationType: string;
  roleNames: string[];
  skillNames: string[];
  createdAt: string;
  submittedAt?: string | null;
  isPublishedToHub: boolean;
  publishedToHubAt?: string | null;
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

export type CompanyRequestInvitationStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type CompanyRequestInvitation = {
  id: number;
  companyRequestId: number;
  companyProfileId: number;
  studentProfileId: number;
  invitedByUserId: number;
  companyRequestRoleId?: number | null;
  companyRequestRoleName?: string | null;
  message?: string | null;
  status: CompanyRequestInvitationStatus;
  matchScore?: number | null;
  source?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  cancelledAt?: string | null;
};

export type CreateCompanyRequestInvitationPayload = {
  studentProfileId: number;
  message?: string | null;
  companyRequestRoleId?: number | null;
  matchScore?: number | null;
  source?: string | null;
};

export type CompanyRequestRecommendationScoreBreakdown = {
  skillOverlap: number;
  roleDisciplineAlignment: number;
  profileRelevance: number;
  collaborationFit: number;
  profileQuality: number;
};

export type CompanyRequestRecommendationStudent = {
  studentProfileId: number;
  userId: number;
  name: string;
  academicYear?: string | null;
  bio?: string | null;
  major?: string | null;
  faculty?: string | null;
  university?: string | null;
  skills: string[];
  email?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
};

export type CompanyRequestRecommendationItem = {
  id: number;
  rank: number;
  score: number;
  reasonSummary: string;
  highlights: string[];
  source: string;
  scoreBreakdown: CompanyRequestRecommendationScoreBreakdown;
  invitationAlreadySent: boolean;
  invitationStatus?: CompanyRequestInvitationStatus | null;
  student: CompanyRequestRecommendationStudent;
};

export type CompanyRequestRecommendationRun = {
  runId: number;
  companyRequestId: number;
  algorithmVersion: string;
  status: string;
  generatedAt: string;
  completedAt?: string | null;
  totalCandidates: number;
};

export type CompanyRequestRecommendationResult = {
  run: CompanyRequestRecommendationRun;
  items: CompanyRequestRecommendationItem[];
};

export type GenerateCompanyRequestRecommendationsPayload = {
  limit?: number;
};

export type GenerateCompanyRequestTeamRecommendationsPayload = {
  teamCount?: number;
  candidatePoolPerRole?: number;
  forceRegenerate?: boolean;
};

export type CompanyRequestTeamRecommendationRun = {
  runId: number;
  companyRequestId: number;
  algorithmVersion: string;
  status: string;
  generatedAt: string;
  completedAt?: string | null;
  totalTeams: number;
};

export type CompanyRequestTeamRecommendationMember = {
  companyRequestRoleId: number;
  roleName: string;
  studentProfileId: number;
  userId: number;
  studentName: string;
  major?: string | null;
  faculty?: string | null;
  university?: string | null;
  roleScore: number;
  semanticSimilarity: number;
  assignmentReason: string;
  highlights: string[];
  email?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
};

export type CompanyRequestTeamRecommendation = {
  teamId: number;
  teamRank: number;
  totalScore: number;
  roleCoverageScore: number;
  compatibilityScore: number;
  summaryReason: string;
  strengths: string[];
  risks: string[];
  members: CompanyRequestTeamRecommendationMember[];
};

export type CompanyRequestTeamRecommendationResult = {
  run: CompanyRequestTeamRecommendationRun;
  teams: CompanyRequestTeamRecommendation[];
};

export type CompanyRequestTeamRecommendationRunHistory = {
  companyRequestId: number;
  totalRuns: number;
  runs: CompanyRequestTeamRecommendationRun[];
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

export async function publishCompanyProjectRequest(
  id: number,
): Promise<CompanyProjectRequestDetail> {
  const { data } = await api.post<CompanyProjectRequestDetail>(
    `/company/requests/${id}/publish`,
  );
  return data;
}

export async function unpublishCompanyProjectRequest(
  id: number,
): Promise<CompanyProjectRequestDetail> {
  const { data } = await api.post<CompanyProjectRequestDetail>(
    `/company/requests/${id}/unpublish`,
  );
  return data;
}

export async function createCompanyRequestInvitation(
  requestId: number,
  payload: CreateCompanyRequestInvitationPayload,
): Promise<CompanyRequestInvitation> {
  const { data } = await api.post<CompanyRequestInvitation>(
    `/company/requests/${requestId}/invitations`,
    payload,
  );
  return data;
}

export async function listCompanyRequestInvitations(
  requestId: number,
): Promise<CompanyRequestInvitation[]> {
  const { data } = await api.get<CompanyRequestInvitation[]>(
    `/company/requests/${requestId}/invitations`,
  );
  return data;
}

export async function listCompanyInvitations(): Promise<CompanyRequestInvitation[]> {
  const { data } = await api.get<CompanyRequestInvitation[]>("/company/invitations");
  return data;
}

export async function cancelCompanyRequestInvitation(
  requestId: number,
  invitationId: number,
): Promise<CompanyRequestInvitation> {
  const { data } = await api.post<CompanyRequestInvitation>(
    `/company/requests/${requestId}/invitations/${invitationId}/cancel`,
  );
  return data;
}

export async function getCompanyRequestRecommendations(
  requestId: number,
): Promise<CompanyRequestRecommendationResult> {
  const { data } = await api.get<CompanyRequestRecommendationResult>(
    `/company/requests/${requestId}/recommendations`,
  );
  return data;
}

export async function generateCompanyRequestRecommendations(
  requestId: number,
  payload: GenerateCompanyRequestRecommendationsPayload = {},
): Promise<CompanyRequestRecommendationResult> {
  const { data } = await api.post<CompanyRequestRecommendationResult>(
    `/company/requests/${requestId}/recommendations/generate`,
    payload,
  );
  return data;
}

export async function getCompanyRequestTeamRecommendations(
  requestId: number,
): Promise<CompanyRequestTeamRecommendationResult> {
  const { data } = await api.get<CompanyRequestTeamRecommendationResult>(
    `/company/requests/${requestId}/team-recommendations`,
  );
  return data;
}

export async function generateCompanyRequestTeamRecommendations(
  requestId: number,
  payload: GenerateCompanyRequestTeamRecommendationsPayload = {},
): Promise<CompanyRequestTeamRecommendationResult> {
  const { data } = await api.post<CompanyRequestTeamRecommendationResult>(
    `/company/requests/${requestId}/team-recommendations/generate`,
    payload,
  );
  return data;
}

export async function regenerateCompanyRequestTeamRecommendations(
  requestId: number,
  payload: GenerateCompanyRequestTeamRecommendationsPayload = {},
): Promise<CompanyRequestTeamRecommendationResult> {
  const { data } = await api.post<CompanyRequestTeamRecommendationResult>(
    `/company/requests/${requestId}/team-recommendations/regenerate`,
    payload,
  );
  return data;
}

export async function getCompanyRequestTeamRecommendationHistory(
  requestId: number,
): Promise<CompanyRequestTeamRecommendationRunHistory> {
  const { data } = await api.get<CompanyRequestTeamRecommendationRunHistory>(
    `/company/requests/${requestId}/team-recommendations/history`,
  );
  return data;
}

export type CompanyStudentDiscoveryProfile = {
  student: {
    studentProfileId: number;
    userId: number;
    name: string;
    email?: string | null;
    bio?: string | null;
    university?: string | null;
    faculty?: string | null;
    major?: string | null;
    academicYear?: string | null;
    availability?: string | null;
    lookingFor?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
    languages: string[];
    roles: string[];
    technicalSkills: string[];
    tools: string[];
    profilePictureBase64?: string | null;
  };
  request: {
    id: number;
    title: string;
    roleNames: string[];
    requiredSkills: string[];
  };
  recommendation: {
    source: string;
    matchScore: number;
    reasonSummary: string;
    highlights: string[];
    strengths: string[];
    gaps: string[];
    alignedRoleName?: string | null;
    relevantSkills: string[];
    scoreBreakdown?: CompanyRequestRecommendationScoreBreakdown | null;
    teamRecommendationId?: number | null;
    rank?: number | null;
  } | null;
  projects: {
    id: number;
    title: string;
    description?: string | null;
    technologies: string[];
    teamRole: string;
    projectType?: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
};

export async function getCompanyStudentDiscoveryProfile(
  requestId: number,
  studentProfileId: number,
  teamId?: number,
): Promise<CompanyStudentDiscoveryProfile> {
  const { data } = await api.get<CompanyStudentDiscoveryProfile>(
    `/company/requests/${requestId}/students/${studentProfileId}`,
    { params: teamId != null ? { teamId } : undefined },
  );
  return data;
}

export type CompanySavedRecommendationIds = {
  studentProfileIds: number[];
  teamRecommendationIds: number[];
};

export type CompanySavedStudentRecommendation = {
  id: number;
  companyRequestId: number;
  requestTitle: string;
  studentProfileId: number;
  studentName: string;
  major?: string | null;
  university?: string | null;
  academicYear?: string | null;
  matchScore?: number | null;
  reasonSummary?: string | null;
  highlights: string[];
  email?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  savedByName: string;
  savedAt: string;
  note?: string | null;
};

export type CompanySavedTeamRecommendation = {
  id: number;
  companyRequestId: number;
  requestTitle: string;
  teamRecommendationId: number;
  teamRank: number;
  totalScore: number;
  roleCoverageScore: number;
  compatibilityScore: number;
  memberCount: number;
  summaryReason: string;
  memberNames: string[];
  savedByName: string;
  savedAt: string;
  note?: string | null;
};

export type CompanySavedRecommendationsPage = {
  students: CompanySavedStudentRecommendation[];
  teams: CompanySavedTeamRecommendation[];
};

export async function getCompanySavedRecommendations(): Promise<CompanySavedRecommendationsPage> {
  const { data } = await api.get<CompanySavedRecommendationsPage>("/company/saved-recommendations");
  return data;
}

export async function getSavedRecommendationIds(
  requestId: number,
): Promise<CompanySavedRecommendationIds> {
  const { data } = await api.get<CompanySavedRecommendationIds>(
    `/company/saved-recommendations/requests/${requestId}/ids`,
  );
  return data;
}

export async function saveStudentRecommendation(
  requestId: number,
  studentProfileId: number,
): Promise<void> {
  await api.put(`/company/saved-recommendations/requests/${requestId}/students/${studentProfileId}`);
}

export async function unsaveStudentRecommendation(
  requestId: number,
  studentProfileId: number,
): Promise<void> {
  await api.delete(
    `/company/saved-recommendations/requests/${requestId}/students/${studentProfileId}`,
  );
}

export async function saveTeamRecommendation(
  requestId: number,
  teamRecommendationId: number,
): Promise<void> {
  await api.put(
    `/company/saved-recommendations/requests/${requestId}/teams/${teamRecommendationId}`,
  );
}

export async function unsaveTeamRecommendation(
  requestId: number,
  teamRecommendationId: number,
): Promise<void> {
  await api.delete(
    `/company/saved-recommendations/requests/${requestId}/teams/${teamRecommendationId}`,
  );
}

export async function updateSavedStudentNote(
  requestId: number,
  studentProfileId: number,
  note: string | null,
): Promise<void> {
  await api.patch(
    `/company/saved-recommendations/requests/${requestId}/students/${studentProfileId}/note`,
    { note },
  );
}

export async function updateSavedTeamNote(
  requestId: number,
  teamRecommendationId: number,
  note: string | null,
): Promise<void> {
  await api.patch(
    `/company/saved-recommendations/requests/${requestId}/teams/${teamRecommendationId}/note`,
    { note },
  );
}

export type CompanyDashboardRequestPreview = {
  id: number;
  title: string;
  requestedRole: string;
  status: string;
  savedStudentsCount: number;
  savedTeamsCount: number;
  createdAt: string;
};

export type CompanyDashboardActivityItem = {
  id: number;
  activityType: string;
  description: string;
  actorName: string;
  createdAt: string;
};

export type CompanyDashboardSavedStudent = {
  companyRequestId: number;
  studentProfileId: number;
  studentName: string;
  university?: string | null;
  major?: string | null;
  matchScore?: number | null;
  savedAt: string;
};

export type CompanyDashboardSavedTeam = {
  companyRequestId: number;
  teamRecommendationId: number;
  teamName: string;
  matchScore: number;
  memberCount: number;
  savedAt: string;
};

export type CompanyDashboard = {
  companyName: string;
  activeRequests: number;
  savedStudents: number;
  savedTeams: number;
  workspaceMembers: number;
  activeRequestsPreview: CompanyDashboardRequestPreview[];
  recentActivity: CompanyDashboardActivityItem[];
  recentSavedStudents: CompanyDashboardSavedStudent[];
  recentSavedTeams: CompanyDashboardSavedTeam[];
};

export async function getCompanyDashboard(): Promise<CompanyDashboard> {
  const { data } = await api.get<CompanyDashboard>("/company/dashboard");
  return data;
}

export type CompanyNotificationPreferences = {
  notifyAiRecommendations: boolean;
  notifySavedRecommendationsActivity: boolean;
  notifyRequestStatusUpdates: boolean;
  notifyWorkspaceMemberChanges: boolean;
};

export type CompanyWorkspaceSummary = {
  ownerName: string;
  membersCount: number;
  activeRequestsCount: number;
};

export type CompanySettings = {
  notifications: CompanyNotificationPreferences;
  workspace: CompanyWorkspaceSummary;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const { data } = await api.get<CompanySettings>("/company/settings");
  return data;
}

export async function updateCompanyNotificationPreferences(
  payload: CompanyNotificationPreferences,
): Promise<CompanyNotificationPreferences> {
  const { data } = await api.put<CompanyNotificationPreferences>(
    "/company/settings/notifications",
    payload,
  );
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/change-password", payload);
  return data;
}

export { parseApiErrorMessage };
