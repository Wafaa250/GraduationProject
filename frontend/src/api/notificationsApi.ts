import api from "./axiosInstance";

export type GraduationNotification = {
  id: number;
  category: string;
  title: string;
  body: string;
  eventType: string;
  projectId: number | null;
  createdAt: string;
  readAt: string | null;
};

/** GET /api/notifications — graduation project notifications for current user. */
export async function getGraduationNotifications(
  take = 50,
): Promise<GraduationNotification[]> {
  const { data } = await api.get<GraduationNotification[]>("/notifications", {
    params: { take },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /api/notifications/unread-count */
export async function getGraduationNotificationsUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count");
  return typeof data?.count === "number" ? data.count : 0;
}

/** POST /api/notifications/{id}/read */
export async function markGraduationNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}
