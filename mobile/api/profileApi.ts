import api from "./axiosInstance";

export type UpdateProfilePayload = {
  fullName?: string;
  bio?: string;
  availability?: string;
  lookingFor?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  profilePictureBase64?: string | null;
  languages?: string[];
  roles?: string[];
  technicalSkills?: string[];
  tools?: string[];
};

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  await api.put("/profile", payload);
}
