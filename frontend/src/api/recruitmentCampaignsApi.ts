import api, { parseApiErrorMessage } from './axiosInstance'
import {
  draftToPayload,
  validateFieldDraft,
  type FormFieldDraft,
} from '../utils/recruitmentFormFields'

export type RecruitmentPosition = {
  id: number
  campaignId: number
  roleTitle: string
  neededCount: number
  description?: string | null
  requirements?: string | null
  requiredSkills?: string | null
  displayOrder: number
}

export type RecruitmentPositionInput = {
  id?: number | null
  roleTitle: string
  neededCount: number
  description?: string | null
  requirements?: string | null
  requiredSkills?: string | null
  displayOrder: number
}

export type RecruitmentCampaign = {
  id: number
  organizationProfileId: number
  title: string
  description: string
  applicationDeadline: string
  coverImageUrl?: string | null
  isPublished: boolean
  createdAt: string
  updatedAt?: string | null
  organizationName?: string | null
  organizationLogoUrl?: string | null
  positions: RecruitmentPosition[]
}

export type CreateRecruitmentCampaignPayload = {
  title: string
  description: string
  applicationDeadline: string
  coverImageUrl?: string | null
  isPublished: boolean
  positions: RecruitmentPositionInput[]
}

export type UpdateRecruitmentCampaignPayload = Partial<
  Omit<CreateRecruitmentCampaignPayload, 'positions'>
> & {
  positions?: RecruitmentPositionInput[]
}

export type PublicRecruitmentCampaignSummary = {
  id: number
  title: string
  coverImageUrl?: string | null
  applicationDeadline: string
  openPositionsCount: number
}

export type RecruitmentQuestion = {
  id: number
  campaignId: number
  questionTitle: string
  questionType: string
  placeholder?: string | null
  helpText?: string | null
  isRequired: boolean
  options?: string[] | null
  displayOrder: number
  createdAt: string
  /** Null = shared campaign-wide form field */
  positionId?: number | null
  positionRoleTitle?: string | null
}

export type CreateRecruitmentQuestionPayload = {
  questionTitle: string
  questionType: string
  placeholder?: string | null
  helpText?: string | null
  isRequired: boolean
  options?: string[] | null
  displayOrder: number
  positionId?: number | null
}

export type UpdateRecruitmentQuestionPayload = Partial<CreateRecruitmentQuestionPayload>

export type PublicRecruitmentCampaignDetail = {
  id: number
  organizationId: number
  title: string
  description: string
  applicationDeadline: string
  coverImageUrl?: string | null
  organizationName: string
  organizationLogoUrl?: string | null
  positions: RecruitmentPosition[]
  questions?: RecruitmentQuestion[]
}

export async function listOrganizationRecruitmentCampaigns(): Promise<RecruitmentCampaign[]> {
  const { data } = await api.get<RecruitmentCampaign[]>('/organization/recruitment-campaigns')
  return data
}

export async function getOrganizationRecruitmentCampaign(id: number): Promise<RecruitmentCampaign> {
  const { data } = await api.get<RecruitmentCampaign>(`/organization/recruitment-campaigns/${id}`)
  return data
}

export async function createOrganizationRecruitmentCampaign(
  payload: CreateRecruitmentCampaignPayload,
): Promise<RecruitmentCampaign> {
  const { data } = await api.post<RecruitmentCampaign>('/organization/recruitment-campaigns', payload)
  return data
}

export async function updateOrganizationRecruitmentCampaign(
  id: number,
  payload: UpdateRecruitmentCampaignPayload,
): Promise<RecruitmentCampaign> {
  const { data } = await api.put<RecruitmentCampaign>(
    `/organization/recruitment-campaigns/${id}`,
    payload,
  )
  return data
}

export async function deleteOrganizationRecruitmentCampaign(id: number): Promise<void> {
  await api.delete(`/organization/recruitment-campaigns/${id}`)
}

export async function uploadRecruitmentCampaignCover(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ coverImageUrl: string }>(
    '/organization/recruitment-campaigns/upload-cover',
    formData,
    { headers: { 'Content-Type': false as unknown as string } },
  )
  return data.coverImageUrl
}

export async function listPublicRecruitmentCampaigns(
  organizationId: number,
): Promise<PublicRecruitmentCampaignSummary[]> {
  const { data } = await api.get<PublicRecruitmentCampaignSummary[]>(
    `/organizations/${organizationId}/recruitment-campaigns`,
  )
  return data
}

export async function getPublicRecruitmentCampaign(
  organizationId: number,
  campaignId: number,
): Promise<PublicRecruitmentCampaignDetail> {
  const { data } = await api.get<PublicRecruitmentCampaignDetail>(
    `/organizations/${organizationId}/recruitment-campaigns/${campaignId}`,
  )
  return data
}

export async function listRecruitmentCampaignQuestions(
  campaignId: number,
): Promise<RecruitmentQuestion[]> {
  const { data } = await api.get<RecruitmentQuestion[]>(
    `/organization/recruitment-campaigns/${campaignId}/questions`,
  )
  return data
}

export async function createRecruitmentCampaignQuestion(
  campaignId: number,
  payload: CreateRecruitmentQuestionPayload,
): Promise<RecruitmentQuestion> {
  const { data } = await api.post<RecruitmentQuestion>(
    `/organization/recruitment-campaigns/${campaignId}/questions`,
    payload,
  )
  return data
}

/** Saves application form fields after campaign creation (same API as edit flow). */
export async function persistCampaignApplicationForm(
  campaignId: number,
  fields: FormFieldDraft[],
): Promise<void> {
  const campaignWide = fields
    .filter((f) => f.positionId == null && !f.positionKey)
    .sort((a, b) => a.displayOrder - b.displayOrder)
  const byPosition = new Map<number, FormFieldDraft[]>()
  for (const f of fields) {
    if (f.positionId == null) continue
    const list = byPosition.get(f.positionId) ?? []
    list.push(f)
    byPosition.set(f.positionId, list)
  }

  let order = 0
  for (const field of campaignWide) {
    const err = validateFieldDraft({ ...field, displayOrder: order })
    if (err) throw new Error(err)
    await createRecruitmentCampaignQuestion(campaignId, draftToPayload({ ...field, displayOrder: order }))
    order += 1
  }

  for (const [, positionFields] of byPosition) {
    const sorted = [...positionFields].sort((a, b) => a.displayOrder - b.displayOrder)
    for (let i = 0; i < sorted.length; i++) {
      const field = { ...sorted[i], displayOrder: i }
      const err = validateFieldDraft(field)
      if (err) throw new Error(err)
      await createRecruitmentCampaignQuestion(campaignId, draftToPayload(field))
    }
  }
}

export async function updateRecruitmentCampaignQuestion(
  campaignId: number,
  questionId: number,
  payload: UpdateRecruitmentQuestionPayload,
): Promise<RecruitmentQuestion> {
  const { data } = await api.put<RecruitmentQuestion>(
    `/organization/recruitment-campaigns/${campaignId}/questions/${questionId}`,
    payload,
  )
  return data
}

export async function deleteRecruitmentCampaignQuestion(
  campaignId: number,
  questionId: number,
): Promise<void> {
  await api.delete(`/organization/recruitment-campaigns/${campaignId}/questions/${questionId}`)
}

export function parseSkillsList(requiredSkills?: string | null): string[] {
  if (!requiredSkills?.trim()) return []
  return requiredSkills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export { parseApiErrorMessage }
