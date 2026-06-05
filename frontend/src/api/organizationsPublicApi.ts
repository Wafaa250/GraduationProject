import api from "./axiosInstance";
import type { EventRegistrationForm } from "@/api/eventRegistrationFormApi";
import type { PublicRecruitmentCampaignDetail } from "@/api/recruitmentCampaignsApi";

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
  areasOfInterest?: string | null;
  isFollowing?: boolean;
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
  registrationForm?: EventRegistrationForm | null;
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

export async function getPublicOrganizationProfile(
  organizationId: number,
): Promise<PublicOrganizationProfile> {
  const { data } = await api.get<PublicOrganizationProfile>(`/organizations/${organizationId}`);
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

export { getPublicRecruitmentCampaign } from "@/api/recruitmentCampaignsApi";
export type { PublicRecruitmentCampaignDetail };

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

type PublicCompanyListRow = {
  id?: number;
  Id?: number;
  companyName?: string;
  CompanyName?: string;
  industry?: string;
  Industry?: string;
  description?: string;
  Description?: string;
  areasOfInterest?: string;
  AreasOfInterest?: string;
  isFollowing?: boolean;
  IsFollowing?: boolean;
};

function mapPublicCompanyRow(row: PublicCompanyListRow): PublicCompanyProfile | null {
  const id = Number(row.id ?? row.Id ?? 0);
  const companyName = String(row.companyName ?? row.CompanyName ?? "").trim();
  if (!id || !companyName) return null;
  return {
    id,
    companyName,
    industry: row.industry ?? row.Industry ?? null,
    description: row.description ?? row.Description ?? null,
    areasOfInterest: row.areasOfInterest ?? row.AreasOfInterest ?? null,
    isFollowing: !!(row.isFollowing ?? row.IsFollowing),
  };
}

/** Loads a company from GET /api/companies/public (existing discovery API). */
export async function getPublicCompanyProfile(
  companyProfileId: number,
  searchHint?: string,
): Promise<PublicCompanyProfile | null> {
  const tryLoad = async (search?: string) => {
    const { data } = await api.get<PublicCompanyListRow[]>("/companies/public", {
      params: search?.trim() ? { search: search.trim() } : undefined,
    });
    const rows = Array.isArray(data) ? data : [];
    for (const row of rows) {
      const mapped = mapPublicCompanyRow(row);
      if (mapped?.id === companyProfileId) return mapped;
    }
    return null;
  };

  if (searchHint?.trim()) {
    const hit = await tryLoad(searchHint);
    if (hit) return hit;
  }
  return tryLoad();
}
