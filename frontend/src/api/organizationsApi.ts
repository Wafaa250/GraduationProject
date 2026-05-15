import api, { parseApiErrorMessage } from './axiosInstance'

export type PublicOrganizationEventSummary = {
  id: number
  title: string
  eventType: string
  category: string
  coverImageUrl?: string | null
  eventDate: string
  location?: string | null
  isOnline: boolean
}

export type PublicLeadershipTeamMember = {
  id: number
  fullName: string
  roleTitle: string
  major?: string | null
  imageUrl?: string | null
  linkedInUrl?: string | null
  displayOrder: number
}

export type PublicStudentOrganizationProfile = {
  organizationId: number
  organizationName: string
  description?: string | null
  faculty?: string | null
  category?: string | null
  logoUrl?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  linkedInUrl?: string | null
  isVerified: boolean
  createdAt: string
  upcomingEvents: PublicOrganizationEventSummary[]
  followersCount: number
  leadershipTeam?: PublicLeadershipTeamMember[]
}

export type OrganizationFollowStatus = {
  isFollowing: boolean
}

export type PublicOrganizationListItem = {
  id: number
  name: string
  category?: string | null
  faculty?: string | null
  logoUrl?: string | null
  isVerified: boolean
}

export type PublicOrganizationEventDetail = {
  id: number
  organizationId: number
  title: string
  description: string
  eventType: string
  category: string
  coverImageUrl?: string | null
  eventDate: string
  registrationDeadline?: string | null
  location?: string | null
  isOnline: boolean
  organizationName: string
  organizationLogoUrl?: string | null
}

export async function listPublicOrganizations(): Promise<PublicOrganizationListItem[]> {
  const { data } = await api.get<PublicOrganizationListItem[]>('/organizations')
  return data
}

export async function getPublicOrganization(
  organizationId: number,
): Promise<PublicStudentOrganizationProfile> {
  const { data } = await api.get<PublicStudentOrganizationProfile>(`/organizations/${organizationId}`)
  return data
}

export async function getPublicOrganizationEvent(
  organizationId: number,
  eventId: number,
): Promise<PublicOrganizationEventDetail> {
  const { data } = await api.get<PublicOrganizationEventDetail>(
    `/organizations/${organizationId}/events/${eventId}`,
  )
  return data
}

export async function getOrganizationFollowStatus(organizationId: number): Promise<OrganizationFollowStatus> {
  const { data } = await api.get<OrganizationFollowStatus>(`/organizations/${organizationId}/follow-status`)
  return data
}

export async function followOrganization(organizationId: number): Promise<void> {
  await api.post(`/organizations/${organizationId}/follow`)
}

export async function unfollowOrganization(organizationId: number): Promise<void> {
  await api.delete(`/organizations/${organizationId}/follow`)
}

export async function getFollowedOrganizations(): Promise<PublicOrganizationListItem[]> {
  const { data } = await api.get<PublicOrganizationListItem[]>('/students/followed-organizations')
  return data
}

export { parseApiErrorMessage }
