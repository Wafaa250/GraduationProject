import api, { parseApiErrorMessage } from "./axiosInstance";
import type { AuthLoginResponse } from "@/types/auth";

export const ASSOCIATION_CATEGORIES = ["Technical", "Volunteer", "Media", "Cultural"] as const;

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

export async function registerStudentAssociation(
  payload: RegisterStudentAssociationPayload,
): Promise<AuthLoginResponse> {
  const { data } = await api.post<AuthLoginResponse>("/auth/register/association", payload);
  return data;
}

export type MobileLogoFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export async function uploadAssociationLogo(file: MobileLogoFile): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const { data } = await api.post<{ logoUrl: string }>("/association/upload-logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.logoUrl;
}

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

export async function getAssociationProfile(): Promise<StudentAssociationProfile> {
  const { data } = await api.get<StudentAssociationProfile>("/association/profile");
  return data;
}

export async function updateAssociationProfile(
  payload: UpdateStudentAssociationProfilePayload,
): Promise<StudentAssociationProfile> {
  const { data } = await api.put<StudentAssociationProfile>("/association/profile", payload);
  return data;
}

export { parseApiErrorMessage };
