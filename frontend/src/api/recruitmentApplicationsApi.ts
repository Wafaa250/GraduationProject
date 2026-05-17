import api, { parseApiErrorMessage } from './axiosInstance'

export type RecruitmentApplicationStatus = 'Pending' | 'Accepted' | 'Rejected'

export type StudentApplicationStatus = {
  hasSubmitted: boolean
  applicationId?: number | null
  status?: RecruitmentApplicationStatus | null
  submittedAt?: string | null
}

export type RecruitmentApplicationAnswerInput = {
  questionId: number
  value?: string | null
  values?: string[] | null
}

export type RecruitmentApplicationSubmitResponse = {
  applicationId: number
  status: RecruitmentApplicationStatus
  submittedAt: string
  message: string
}

export type RecruitmentApplicationListItem = {
  id: number
  studentProfileId: number
  studentName: string
  studentEmail?: string | null
  studentMajor?: string | null
  positionId: number
  positionRoleTitle: string
  status: RecruitmentApplicationStatus
  submittedAt: string
  previewAnswer: string
}

export type RecruitmentApplicationAnswerDetail = {
  questionId: number
  questionTitle: string
  questionType: string
  answerValue: string
  selectedValues?: string[] | null
}

export type RecruitmentApplicationDetail = {
  id: number
  organizationId: number
  campaignId: number
  campaignTitle: string
  positionId: number
  positionRoleTitle: string
  studentProfileId: number
  studentName: string
  studentEmail?: string | null
  studentMajor?: string | null
  studentAcademicYear?: string | null
  status: RecruitmentApplicationStatus
  submittedAt: string
  updatedAt?: string | null
  answers: RecruitmentApplicationAnswerDetail[]
}

export async function getMyRecruitmentApplication(
  organizationId: number,
  campaignId: number,
  positionId: number,
): Promise<StudentApplicationStatus> {
  const { data } = await api.get<StudentApplicationStatus>(
    `/organizations/${organizationId}/recruitment-campaigns/${campaignId}/positions/${positionId}/applications/mine`,
  )
  return data
}

export async function submitRecruitmentApplication(
  organizationId: number,
  campaignId: number,
  positionId: number,
  answers: RecruitmentApplicationAnswerInput[],
): Promise<RecruitmentApplicationSubmitResponse> {
  const { data } = await api.post<RecruitmentApplicationSubmitResponse>(
    `/organizations/${organizationId}/recruitment-campaigns/${campaignId}/positions/${positionId}/applications`,
    { answers },
  )
  return data
}

export async function uploadRecruitmentApplicationFile(
  organizationId: number,
  campaignId: number,
  file: File,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ fileUrl: string }>(
    `/organizations/${organizationId}/recruitment-campaigns/${campaignId}/application-uploads`,
    formData,
    { headers: { 'Content-Type': false as unknown as string } },
  )
  return data.fileUrl
}

export async function listOrganizationRecruitmentApplications(
  campaignId: number,
  params?: { positionId?: number; status?: RecruitmentApplicationStatus },
): Promise<RecruitmentApplicationListItem[]> {
  const { data } = await api.get<RecruitmentApplicationListItem[]>(
    `/organization/recruitment-campaigns/${campaignId}/applications`,
    { params },
  )
  return data
}

export async function getOrganizationRecruitmentApplication(
  campaignId: number,
  applicationId: number,
): Promise<RecruitmentApplicationDetail> {
  const { data } = await api.get<RecruitmentApplicationDetail>(
    `/organization/recruitment-campaigns/${campaignId}/applications/${applicationId}`,
  )
  return data
}

export async function updateRecruitmentApplicationStatus(
  campaignId: number,
  applicationId: number,
  status: RecruitmentApplicationStatus,
): Promise<RecruitmentApplicationDetail> {
  const { data } = await api.patch<RecruitmentApplicationDetail>(
    `/organization/recruitment-campaigns/${campaignId}/applications/${applicationId}/status`,
    { status },
  )
  return data
}

export { parseApiErrorMessage }
