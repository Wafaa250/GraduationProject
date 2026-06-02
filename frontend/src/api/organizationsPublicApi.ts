import api from "./axiosInstance";

export type PublicOrganizationProfile = {
  organizationId: number;
  organizationName: string;
  description?: string | null;
  faculty?: string | null;
  category?: string | null;
  logoUrl?: string | null;
  followersCount: number;
};

export async function getPublicOrganizationProfile(
  organizationId: number,
): Promise<PublicOrganizationProfile> {
  const { data } = await api.get<PublicOrganizationProfile>(`/organizations/${organizationId}`);
  return data;
}
