import api from "./axiosInstance";

export type GraduationNotificationDto = {
  id: number;
  title: string;
  body: string;
  eventType: string;
  projectId: number | null;
  createdAt: string;
  readAt: string | null;
};

const GRAD_CATEGORY = "graduation_project";

export async function fetchGraduationNotifications(take = 50): Promise<GraduationNotificationDto[]> {
  const { data } = await api.get<GraduationNotificationDto[]>("/notifications", {
    params: { take },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadGraduationNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { _t: Date.now() },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

export async function markAllGraduationNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all", null, {
    params: { category: GRAD_CATEGORY },
  });
}

export async function markGraduationNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}
