import api, { parseApiErrorMessage } from "./axiosInstance";
import { isAssociationRole } from "@/utils/organizationRole";

export const ASSOCIATION_CATEGORIES = ["Technical", "Volunteer", "Media", "Cultural"] as const;

export type StudentAssociationProfile = {
  id: number;
  userId: number;
  role: string;
  associationName: string;
  username: string;
  email: string;
  description?: string | null;
  faculty?: string | null;
  category?: string | null;
  logoUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  linkedInUrl?: string | null;
  isVerified: boolean;
  createdAt: string;
};

export type RegisterStudentAssociationPayload = {
  associationName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  description?: string;
  faculty: string;
  category: string;
  logoUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedInUrl?: string;
};

export type UpdateStudentAssociationProfilePayload = {
  associationName?: string;
  username?: string;
  description?: string;
  faculty?: string;
  category?: string;
  logoUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedInUrl?: string;
};

export type AuthResponse = {
  token: string;
  role: string;
  userId: number;
  name: string;
  email: string;
  profileId: number;
};

export async function registerStudentAssociation(
  payload: RegisterStudentAssociationPayload,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/association", payload);
  return data;
}

export async function getAssociationProfile(): Promise<StudentAssociationProfile> {
  const { data } = await api.get<StudentAssociationProfile>("/association/profile");
  return data;
}

export async function uploadAssociationLogoFromUri(
  localUri: string,
  mimeType: string,
  filename = "logo.jpg",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);
  const { data } = await api.post<{ logoUrl: string }>("/association/upload-logo", formData, {
    headers: { "Content-Type": false as unknown as string },
  });
  return data.logoUrl;
}

export async function updateAssociationProfile(
  payload: UpdateStudentAssociationProfilePayload,
): Promise<StudentAssociationProfile> {
  const { data } = await api.put<StudentAssociationProfile>("/association/profile", payload);
  return data;
}

export { isAssociationRole };
export { parseApiErrorMessage };
