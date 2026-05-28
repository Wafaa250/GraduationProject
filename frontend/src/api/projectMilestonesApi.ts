import api from "./axiosInstance";

export type ProjectMilestone = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "Pending" | "In Progress" | "Completed";
  createdAt: string;
};

export type CreateProjectMilestonePayload = {
  title: string;
  description?: string;
  dueDate?: string;
};

export async function getProjectMilestones(projectId: number): Promise<ProjectMilestone[]> {
  const { data } = await api.get<ProjectMilestone[]>(`/graduation-projects/${projectId}/milestones`);
  return Array.isArray(data) ? data : [];
}

export async function createProjectMilestone(
  projectId: number,
  payload: CreateProjectMilestonePayload,
): Promise<ProjectMilestone> {
  const { data } = await api.post<ProjectMilestone>(`/graduation-projects/${projectId}/milestones`, payload);
  return data;
}

export async function updateProjectMilestoneStatus(
  projectId: number,
  milestoneId: number,
  status: ProjectMilestone["status"],
): Promise<ProjectMilestone> {
  const { data } = await api.patch<ProjectMilestone>(
    `/graduation-projects/${projectId}/milestones/${milestoneId}/status`,
    { status },
  );
  return data;
}

export async function deleteProjectMilestone(projectId: number, milestoneId: number): Promise<void> {
  await api.delete(`/graduation-projects/${projectId}/milestones/${milestoneId}`);
}
