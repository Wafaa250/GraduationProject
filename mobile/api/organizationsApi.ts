import api, { parseApiErrorMessage } from "./axiosInstance";

export type PublicOrganizationDiscovery = {
  id: number;
  organizationName: string;
  username: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  shortDescription?: string | null;
  category?: string | null;
  followersCount: number;
  isFollowing: boolean;
};

export async function listPublicOrganizationsForDiscovery(): Promise<PublicOrganizationDiscovery[]> {
  const { data } = await api.get<PublicOrganizationDiscovery[]>("/organizations/public");
  return data;
}

export async function getFollowingOrganizations(): Promise<PublicOrganizationDiscovery[]> {
  const { data } = await api.get<PublicOrganizationDiscovery[]>("/students/following-organizations");
  return data;
}

export async function followOrganization(organizationId: number): Promise<void> {
  await api.post(`/organizations/${organizationId}/follow`);
}

export async function unfollowOrganization(organizationId: number): Promise<void> {
  await api.delete(`/organizations/${organizationId}/follow`);
}

export { parseApiErrorMessage };
