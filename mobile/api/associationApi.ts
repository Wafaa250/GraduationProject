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

export { parseApiErrorMessage };
