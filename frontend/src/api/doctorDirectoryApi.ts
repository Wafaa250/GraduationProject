import api from "./axiosInstance";

export type DoctorDirectoryEntry = {
  userId: number;
  profileId: number;
  name: string;
  specialization?: string;
};

/** GET /api/doctors — list doctors (used to resolve profile id → user id). */
export async function listDoctorsDirectory(): Promise<DoctorDirectoryEntry[]> {
  const { data } = await api.get<
    {
      userId: number;
      profileId: number;
      name: string;
      specialization?: string;
    }[]
  >("/doctors");
  if (!Array.isArray(data)) return [];
  return data.map((d) => ({
    userId: d.userId,
    profileId: d.profileId,
    name: d.name,
    specialization: d.specialization,
  }));
}
