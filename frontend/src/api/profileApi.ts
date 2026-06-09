import api from "./axiosInstance";

export type CollaborationPreferences = {
  workingStyle?: string;
  teamwork?: string;
  collaboration?: string;
};

export type OtherLink = {
  label: string;
  url: string;
};

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
  collaborationPreferences?: CollaborationPreferences;
  otherLinks?: OtherLink[];
  expectedGraduation?: string;
  personalWebsite?: string;
};

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  await api.put("/profile", payload);
}
