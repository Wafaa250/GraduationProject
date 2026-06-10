import api from "@/api/axiosInstance";

export type DoctorDirectoryEntry = {
  userId: number;
  profileId: number;
  name: string;
  specialization?: string;
};

/** GET /api/doctors — resolve doctor profile id → user id for public profile links. */
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
