import api from "./axiosInstance";

export type RecruitmentApplicationStatus = "Pending" | "Accepted" | "Rejected";

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
  answers: RecruitmentApplicationAnswerDetail[];
};

export type RecruitmentApplicantAnalysisResult = {
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

export async function getOrganizationRecruitmentApplication(
  campaignId: number,
  applicationId: number,
): Promise<RecruitmentApplicationDetail> {
  const { data } = await api.get<RecruitmentApplicationDetail>(
    `/organization/recruitment-campaigns/${campaignId}/applications/${applicationId}`,
  );
  return data;
}

export async function analyzeRecruitmentApplicants(
  campaignId: number,
  positionId: number,
): Promise<RecruitmentApplicantAnalysisResponse> {
  const { data } = await api.post<RecruitmentApplicantAnalysisResponse>(
    `/organization/recruitment-campaigns/${campaignId}/positions/${positionId}/analyze-applicants`,
  );
  return data;
}
