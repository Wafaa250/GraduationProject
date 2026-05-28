import api from "./axiosInstance";

export type UpdateDoctorProfilePayload = {
  fullName?: string;
  department?: string;
  faculty?: string;
  specialization?: string;
  university?: string;
  academicRank?: string;
  yearsOfExperience?: number | null;
  linkedin?: string;
  officeHours?: string;
  office?: string;
  phone?: string;
  bio?: string;
  profilePictureBase64?: string | null;
  technicalSkills?: string[];
  researchSkills?: string[];
};

/** PUT /api/profile/doctor */
export async function updateDoctorProfile(payload: UpdateDoctorProfilePayload): Promise<void> {
  await api.put("/profile/doctor", payload);
}
