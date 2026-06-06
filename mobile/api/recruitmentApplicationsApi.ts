import api, { parseApiErrorMessage } from "./axiosInstance";

export type RecruitmentApplicationStatus = "Pending" | "AiSuggested" | "Accepted" | "Rejected";

export type RecruitmentApplicationListItem = {
  id: number;
  studentProfileId: number;
  studentName: string;
  studentEmail?: string | null;
  studentMajor?: string | null;
  positionId: number;
  positionRoleTitle: string;
  status: RecruitmentApplicationStatus;
  submittedAt: string;
  previewAnswer: string;
};

export type RecruitmentApplicationAnswerDetail = {
  questionId: number;
  questionTitle: string;
  questionType: string;
  answerValue: string;
  selectedValues?: string[] | null;
};

export type RecruitmentApplicationDetail = {
  id: number;
  organizationId: number;
  campaignId: number;
  campaignTitle: string;
  positionId: number;
  positionRoleTitle: string;
  studentProfileId: number;
  studentName: string;
  studentEmail?: string | null;
  studentMajor?: string | null;
  studentAcademicYear?: string | null;
  status: RecruitmentApplicationStatus;
  submittedAt: string;
  updatedAt?: string | null;
  acceptedAt?: string | null;
  answers: RecruitmentApplicationAnswerDetail[];
};

export type RecruitmentApplicationDecisionResponse = {
  application: RecruitmentApplicationDetail;
  addedToOrganization: boolean;
  memberAcceptedAt?: string | null;
  organizationMemberId?: number | null;
  membershipKind?: string | null;
  teamMemberId?: number | null;
  addedToLeadershipShowcase?: boolean;
};

export async function listOrganizationRecruitmentApplications(
  campaignId: number,
  params?: { positionId?: number; status?: RecruitmentApplicationStatus },
): Promise<RecruitmentApplicationListItem[]> {
  const { data } = await api.get<RecruitmentApplicationListItem[]>(
    `/organization/recruitment-campaigns/${campaignId}/applications`,
    { params },
  );
  return data;
}

export async function getOrganizationRecruitmentApplication(
  campaignId: number,
  applicationId: number,
): Promise<RecruitmentApplicationDetail> {
  const { data } = await api.get<RecruitmentApplicationDetail>(
    `/organization/recruitment-campaigns/${campaignId}/applications/${applicationId}`,
  );
  return data;
}

export async function updateRecruitmentApplicationStatus(
  campaignId: number,
  applicationId: number,
  status: RecruitmentApplicationStatus,
): Promise<RecruitmentApplicationDetail> {
  const { data } = await api.patch<RecruitmentApplicationDetail>(
    `/organization/recruitment-campaigns/${campaignId}/applications/${applicationId}/status`,
    { status },
  );
  return data;
}

export async function acceptRecruitmentApplication(
  applicationId: number,
): Promise<RecruitmentApplicationDecisionResponse> {
  const { data } = await api.post<RecruitmentApplicationDecisionResponse>(
    `/organization/recruitment-applications/${applicationId}/accept`,
  );
  return data;
}

export async function rejectRecruitmentApplication(
  applicationId: number,
): Promise<RecruitmentApplicationDecisionResponse> {
  const { data } = await api.post<RecruitmentApplicationDecisionResponse>(
    `/organization/recruitment-applications/${applicationId}/reject`,
  );
  return data;
}

export type RecruitmentAiRegenerateRequest = {
  excludeStudentIds?: number[];
  preferSkills?: string[];
  preferMajors?: string[];
  minMatch?: number;
  excludeRejectedApplicants?: boolean;
};

export type RecruitmentApplicantAnalysisResult = {
  status?: RecruitmentApplicationStatus;
  studentId: number;
  studentUserId: number;
  applicationId: number;
  matchScore: number;
  strengths: string[];
  concerns: string[];
  reason: string;
  studentName: string;
  faculty?: string | null;
  major?: string | null;
};

export type RecruitmentApplicantAnalysisResponse = {
  results: RecruitmentApplicantAnalysisResult[];
  analyzedAt: string;
};

export async function analyzeRecruitmentApplicants(
  campaignId: number,
  positionId: number,
): Promise<RecruitmentApplicantAnalysisResponse> {
  const { data } = await api.post<RecruitmentApplicantAnalysisResponse>(
    `/organization/recruitment-campaigns/${campaignId}/positions/${positionId}/analyze-applicants`,
  );
  return data;
}

export async function regenerateRecruitmentApplicants(
  campaignId: number,
  positionId: number,
  body: RecruitmentAiRegenerateRequest,
): Promise<RecruitmentApplicantAnalysisResponse> {
  const { data } = await api.post<RecruitmentApplicantAnalysisResponse>(
    `/organization/recruitment-campaigns/${campaignId}/positions/${positionId}/ai-regenerate`,
    body,
  );
  return data;
}

export { parseApiErrorMessage };
