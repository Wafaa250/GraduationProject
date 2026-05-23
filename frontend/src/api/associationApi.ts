import api, { parseApiErrorMessage } from "./axiosInstance";

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

export async function uploadAssociationLogo(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ logoUrl: string }>("/association/upload-logo", formData, {
    headers: { "Content-Type": false as unknown as string },
    onUploadProgress: (event: { loaded: number; total?: number }) => {
      if (event.total) {
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return data.logoUrl;
}

export function isAssociationRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r === "studentassociation" || r === "association";
}

export { parseApiErrorMessage };
