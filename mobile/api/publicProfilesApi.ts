import api from "./axiosInstance";

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
  followersCount: number;
};

export type PublicCompanyProfile = {
  id: number;
  companyName: string;
  industry?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  email?: string | null;
};

export async function getPublicOrganizationProfile(
  organizationId: number,
): Promise<PublicOrganizationProfile> {
  const { data } = await api.get<PublicOrganizationProfile>(`/organizations/${organizationId}`);
  return data;
}

export async function getPublicCompanyProfile(companyProfileId: number): Promise<PublicCompanyProfile> {
  const { data } = await api.get<Record<string, unknown>>(
    `/companies/${companyProfileId}/profile`,
  );
  return {
    id: Number(data.id ?? data.Id ?? companyProfileId),
    companyName: String(data.companyName ?? data.CompanyName ?? ""),
    industry: (data.industry ?? data.Industry) as string | null | undefined,
    description: (data.description ?? data.Description) as string | null | undefined,
    websiteUrl: (data.websiteUrl ?? data.WebsiteUrl) as string | null | undefined,
    linkedInUrl: (data.linkedInUrl ?? data.LinkedInUrl) as string | null | undefined,
    email: String(data.email ?? data.Email ?? data.contactEmail ?? data.ContactEmail ?? ""),
  };
}
