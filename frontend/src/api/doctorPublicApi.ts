import api from "./axiosInstance";

export type DoctorPublicProfile = {
  userId: number;
  profileId: number;
  user: {
    userId: number;
    name: string;
    email: string;
    profilePictureBase64?: string | null;
    role: string;
  };
  doctorProfile: {
    profileId: number;
    department: string;
    faculty?: string | null;
    specialization?: string | null;
    university?: string | null;
    yearsOfExperience?: number | null;
    linkedin?: string | null;
    officeHours?: string | null;
    bio?: string | null;
    profilePictureBase64?: string | null;
    technicalSkills: string[];
    researchSkills: string[];
  };
};

/** GET /api/doctors/{userId} — public doctor profile (user id). */
export async function getDoctorPublicProfile(userId: number): Promise<DoctorPublicProfile> {
  const { data } = await api.get<DoctorPublicProfile>(`/doctors/${userId}`);
  return data;
}
