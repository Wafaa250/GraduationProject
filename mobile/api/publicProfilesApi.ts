import api from "./axiosInstance";

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
  studentUserId?: number | null;
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
};

export type PublicOrganizationMember = {
  studentUserId: number;
  studentName: string;
  roleTitle: string;
  major?: string | null;
};

export type PublicOrganizationProfile = {
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
  leadershipTeam: PublicLeadershipTeamMember[];
  members: PublicOrganizationMember[];
};

export type PublicCompanyProfile = {
  id: number;
  companyName: string;
  industry?: string | null;
  description?: string | null;
  headquartersLocation?: string | null;
  location?: string | null;
  workingStyle?: string | null;
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  contactEmail?: string | null;
  optionalContactLink?: string | null;
  areasOfInterest?: string[];
  isFollowing?: boolean;
};

export type PublicCompanyOpportunitySummary = {
  id: number;
  title: string;
  category: string;
  collaborationFormat?: string | null;
  durationLabel?: string | null;
  publishedAt?: string | null;
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
  registrationForm?: {
    fields?: {
      id: number;
      label: string;
      fieldType: string;
      placeholder?: string | null;
      helpText?: string | null;
      isRequired: boolean;
      options?: string[] | null;
      displayOrder: number;
    }[];
  } | null;
};

export type PublicCompanyOpportunityRole = {
  roleName: string;
  skills: string[];
};

export type PublicCompanyOpportunityDetail = {
  id: number;
  companyProfileId: number;
  companyName: string;
  industry?: string | null;
  title: string;
  description: string;
  category: string;
  requestType: string;
  collaborationFormat?: string | null;
  durationLabel?: string | null;
  skills: string[];
  roleCount: number;
  publishedAt?: string | null;
  contactEmail?: string | null;
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  scopeNotes?: string | null;
  roles: PublicCompanyOpportunityRole[];
};

export type PublicCompanyTalentRequestDetail = {
  id: number;
  companyProfileId: number;
  companyName: string;
  industry?: string | null;
  title: string;
  description: string;
  engagementType?: string | null;
  duration?: string | null;
  preferredMajor?: string | null;
  skills: string[];
  createdAt: string;
};

function parseAreasList(raw?: string[] | string | null): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function getPublicOrganizationProfile(
  organizationId: number,
): Promise<PublicOrganizationProfile> {
  const { data } = await api.get<Record<string, unknown>>(`/organizations/${organizationId}`);
  return {
    organizationId: Number(data.organizationId ?? data.OrganizationId ?? organizationId),
    organizationName: String(data.organizationName ?? data.OrganizationName ?? ""),
    description: (data.description ?? data.Description) as string | null | undefined,
    faculty: (data.faculty ?? data.Faculty) as string | null | undefined,
    category: (data.category ?? data.Category) as string | null | undefined,
    logoUrl: (data.logoUrl ?? data.LogoUrl) as string | null | undefined,
    instagramUrl: (data.instagramUrl ?? data.InstagramUrl) as string | null | undefined,
    facebookUrl: (data.facebookUrl ?? data.FacebookUrl) as string | null | undefined,
    linkedInUrl: (data.linkedInUrl ?? data.LinkedInUrl) as string | null | undefined,
    isVerified: Boolean(data.isVerified ?? data.IsVerified),
    createdAt: String(data.createdAt ?? data.CreatedAt ?? ""),
    upcomingEvents: asArray<PublicOrganizationEventSummary>(
      data.upcomingEvents ?? data.UpcomingEvents,
    ),
    followersCount: Number(data.followersCount ?? data.FollowersCount ?? 0),
    leadershipTeam: asArray<PublicLeadershipTeamMember>(
      data.leadershipTeam ?? data.LeadershipTeam,
    ),
    members: asArray<PublicOrganizationMember>(data.members ?? data.Members),
  };
}

/** Full read-only company profile for students. */
export async function getPublicCompanyProfileDetail(
  companyProfileId: number,
): Promise<PublicCompanyProfile | null> {
  try {
    const { data } = await api.get<Record<string, unknown>>(
      `/companies/${companyProfileId}/profile`,
    );
    const id = Number(data.id ?? data.Id ?? companyProfileId);
    const companyName = String(data.companyName ?? data.CompanyName ?? "").trim();
    if (!id || !companyName) return null;
    const rawAreas = (data.areasOfInterest ?? data.AreasOfInterest) as string[] | string | null | undefined;
    return {
      id,
      companyName,
      industry: (data.industry ?? data.Industry) as string | null | undefined,
      description: (data.description ?? data.Description) as string | null | undefined,
      headquartersLocation: (data.headquartersLocation ?? data.HeadquartersLocation) as
        | string
        | null
        | undefined,
      location: (data.location ?? data.Location) as string | null | undefined,
      workingStyle: (data.workingStyle ?? data.WorkingStyle) as string | null | undefined,
      websiteUrl: (data.websiteUrl ?? data.WebsiteUrl) as string | null | undefined,
      linkedInUrl: (data.linkedInUrl ?? data.LinkedInUrl) as string | null | undefined,
      contactEmail: String(
        data.contactEmail ?? data.ContactEmail ?? data.email ?? data.Email ?? "",
      ).trim() || null,
      optionalContactLink: (data.optionalContactLink ?? data.OptionalContactLink) as
        | string
        | null
        | undefined,
      areasOfInterest: parseAreasList(rawAreas),
      isFollowing: Boolean(data.isFollowing ?? data.IsFollowing),
    };
  } catch {
    return null;
  }
}

/** Published opportunities for a company (public profile). */
export async function listPublicCompanyOpportunities(
  companyProfileId: number,
): Promise<PublicCompanyOpportunitySummary[]> {
  try {
    const { data } = await api.get<PublicCompanyOpportunitySummary[]>(
      `/companies/${companyProfileId}/opportunities`,
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPublicCompanyProfile(
  companyProfileId: number,
): Promise<PublicCompanyProfile> {
  const detail = await getPublicCompanyProfileDetail(companyProfileId);
  if (detail) return detail;
  throw new Error("Company not found.");
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

export async function getPublicCompanyOpportunity(
  companyProfileId: number,
  requestId: number,
): Promise<PublicCompanyOpportunityDetail> {
  const { data } = await api.get<PublicCompanyOpportunityDetail>(
    `/companies/${companyProfileId}/opportunities/${requestId}`,
  );
  return data;
}

export async function getPublicCompanyTalentRequest(
  companyProfileId: number,
  talentRequestId: number,
): Promise<PublicCompanyTalentRequestDetail> {
  const { data } = await api.get<PublicCompanyTalentRequestDetail>(
    `/companies/${companyProfileId}/talent-requests/${talentRequestId}`,
  );
  return data;
}
