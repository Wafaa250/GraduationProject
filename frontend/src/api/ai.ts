import api from "./axiosInstance";

export const recommendStudents = async (projectId: number) => {
  const res = await api.post("/ai/recommend-students", { projectId });
  return res.data;
};
