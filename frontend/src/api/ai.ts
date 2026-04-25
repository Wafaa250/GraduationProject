import api from "./axiosInstance";
import { apiClient } from "./client";

export const recommendStudents = async (projectId: number) => {
  const res = await api.post("/ai/recommend-students", { projectId });
  return res.data;
};

export interface AiSupervisor {
  doctorId: number;
  matchScore: number;
  reason: string;
}

export const aiApi = {
  recommendSupervisors: async (
    projectId: number,
  ): Promise<AiSupervisor[]> => {
    const response = await apiClient.post<AiSupervisor[]>(
      "/ai/recommend-supervisors",
      {
        projectId,
      },
    );
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },
};
