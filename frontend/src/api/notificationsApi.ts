import api from "./axiosInstance";

export type AppNotification = {
  id: number;
  category: string;
  title: string;
  body: string;
  eventType: string;
  projectId: number | null;
  createdAt: string;
  readAt: string | null;
};

export const NOTIFICATION_CATEGORY = {
  graduation: "graduation_project",
  company: "company",
  chat: "chat",
  course: "course",
} as const;

/** GET /api/notifications */
export async function getNotifications(
  take = 50,
  category?: string,
): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>("/notifications", {
    params: { take, ...(category ? { category } : {}) },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /api/notifications/unread-count */
export async function getNotificationsUnreadCount(category?: string): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: category ? { category } : {},
  });
  return typeof data?.count === "number" ? data.count : 0;
}

/** POST /api/notifications/{id}/read */
export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

/** GET /api/notifications — graduation project notifications for current user. */
export async function getGraduationNotifications(take = 50): Promise<AppNotification[]> {
  return getNotifications(take, NOTIFICATION_CATEGORY.graduation);
}

/** GET /api/notifications/unread-count */
export async function getGraduationNotificationsUnreadCount(): Promise<number> {
  return getNotificationsUnreadCount(NOTIFICATION_CATEGORY.graduation);
}

/** POST /api/notifications/{id}/read */
export async function markGraduationNotificationRead(id: number): Promise<void> {
  return markNotificationRead(id);
}

export async function getCompanyNotifications(take = 50): Promise<AppNotification[]> {
  return getNotifications(take, NOTIFICATION_CATEGORY.company);
}

export async function getCompanyNotificationsUnreadCount(): Promise<number> {
  return getNotificationsUnreadCount(NOTIFICATION_CATEGORY.company);
}

export async function markCompanyNotificationRead(id: number): Promise<void> {
  return markNotificationRead(id);
}

export type GraduationNotification = AppNotification;
