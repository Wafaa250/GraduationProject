import api, { parseApiErrorMessage } from "./axiosInstance";

export type PublicOrganizationEventSummary = {
  id: number;
  title: string;
  eventType: string;
  category: string;
  coverImageUrl?: string | null;
  eventDate: string;
  location?: string | null;
  isOnline: boolean;
};

export type PublicLeadershipTeamMember = {
  id: number;
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
  displayOrder: number;
};

export type PublicStudentOrganizationProfile = {
  organizationId: number;
  organizationName: string;
  description?: string | null;
  faculty?: string | null;
  category?: string | null;
  logoUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  linkedInUrl?: string | null;
  isVerified: boolean;
  createdAt: string;
  upcomingEvents: PublicOrganizationEventSummary[];
  followersCount: number;
  leadershipTeam?: PublicLeadershipTeamMember[];
};

export type EventRegistrationFieldPublic = {
  id: number;
  formId: number;
  label: string;
  fieldType: string;
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  options?: string[] | null;
  displayOrder: number;
  createdAt: string;
};

export type EventRegistrationFormPublic = {
  id: number;
  eventId: number;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  fields: EventRegistrationFieldPublic[];
};

export type PublicOrganizationEventDetail = {
  id: number;
  organizationId: number;
  title: string;
  description: string;
  eventType: string;
  category: string;
  coverImageUrl?: string | null;
  eventDate: string;
  registrationDeadline?: string | null;
  location?: string | null;
  isOnline: boolean;
  organizationName: string;
  organizationLogoUrl?: string | null;
  registrationForm?: EventRegistrationFormPublic | null;
};

export async function getPublicOrganization(organizationId: number): Promise<PublicStudentOrganizationProfile> {
  const { data } = await api.get<PublicStudentOrganizationProfile>(`/organizations/${organizationId}`);
  return data;
}

export async function getPublicOrganizationEvent(
  organizationId: number,
  eventId: number,
): Promise<PublicOrganizationEventDetail> {
  const { data } = await api.get<PublicOrganizationEventDetail>(
    `/organizations/${organizationId}/events/${eventId}`,
  );
  return data;
}

export { parseApiErrorMessage };
