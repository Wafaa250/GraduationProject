import api, { parseApiErrorMessage } from "./axiosInstance";

export type OrganizationTeamMember = {
  id: number;
  organizationProfileId: number;
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string | null;
};

export type CreateOrganizationTeamMemberPayload = {
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
  displayOrder: number;
};

export type UpdateOrganizationTeamMemberPayload = CreateOrganizationTeamMemberPayload;

export async function listOrganizationTeamMembers(): Promise<OrganizationTeamMember[]> {
  const { data } = await api.get<OrganizationTeamMember[]>("/organization/team-members");
  return data;
}

export async function createOrganizationTeamMember(
  payload: CreateOrganizationTeamMemberPayload,
): Promise<OrganizationTeamMember> {
  const { data } = await api.post<OrganizationTeamMember>("/organization/team-members", payload);
  return data;
}

export async function updateOrganizationTeamMember(
  id: number,
  payload: UpdateOrganizationTeamMemberPayload,
): Promise<OrganizationTeamMember> {
  const { data } = await api.put<OrganizationTeamMember>(`/organization/team-members/${id}`, payload);
  return data;
}

export async function deleteOrganizationTeamMember(id: number): Promise<void> {
  await api.delete(`/organization/team-members/${id}`);
}

export async function uploadOrganizationTeamMemberPortraitFromUri(
  localUri: string,
  mimeType: string,
  filename = "portrait.jpg",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);
  const { data } = await api.post<{ imageUrl: string }>(
    "/organization/team-members/upload-image",
    formData,
    { headers: { "Content-Type": false as unknown as string } },
  );
  return data.imageUrl;
}

export { parseApiErrorMessage };
