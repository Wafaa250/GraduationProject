import api, { parseApiErrorMessage } from "./axiosInstance";
import { appendMobileUploadFile, type MobileUploadFile } from "./mobileUpload";

export type OrganizationTeamMember = {
  id: number;
  organizationProfileId: number;
  studentProfileId?: number | null;
  studentUserId?: number | null;
  sourceApplicationId?: number | null;
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isLinkedStudent?: boolean;
  joinedViaRecruitment?: boolean;
};

export type CreateOrganizationTeamMemberPayload = {
  fullName: string;
  roleTitle: string;
  major?: string | null;
  imageUrl?: string | null;
  linkedInUrl?: string | null;
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

export async function uploadOrganizationTeamMemberImage(file: MobileUploadFile): Promise<string> {
  const formData = new FormData();
  appendMobileUploadFile(formData, "file", file);
  const { data } = await api.post<{ imageUrl: string }>(
    "/organization/team-members/upload-image",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.imageUrl;
}

export { parseApiErrorMessage };
