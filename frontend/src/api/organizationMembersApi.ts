import api, { parseApiErrorMessage } from './axiosInstance'

export type OrganizationMemberListItem = {
  id: number
  studentProfileId: number
  studentUserId: number
  studentName: string
  studentEmail?: string | null
  major?: string | null
  roleTitle: string
  membershipKind: 'Leadership' | 'Member'
  sourceApplicationId?: number | null
  teamMemberId?: number | null
  acceptedAt: string
  joinedViaRecruitment: boolean
}

export type StudentOrganizationMembership = {
  organizationMemberId: number
  organizationId: number
  organizationName: string
  organizationLogoUrl?: string | null
  roleTitle: string
  membershipKind: string
  joinedAt: string
  sourceApplicationId?: number | null
  campaignId?: number | null
  campaignTitle?: string | null
  joinedViaRecruitment: boolean
}

export async function listOrganizationMembers(
  kind?: 'Leadership' | 'Member',
): Promise<OrganizationMemberListItem[]> {
  const { data } = await api.get<OrganizationMemberListItem[]>('/organization/members', {
    params: kind ? { kind } : undefined,
  })
  return data
}

export async function listMyStudentOrganizationMemberships(): Promise<StudentOrganizationMembership[]> {
  const { data } = await api.get<StudentOrganizationMembership[]>('/student/organization-memberships')
  return data
}

export { parseApiErrorMessage }
