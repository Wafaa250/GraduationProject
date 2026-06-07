import api from "./axiosInstance";

export type AppNotification = {
  id: number;
  category: string;
  title: string;
  body: string;
  eventType: string;
  projectId: number | null;
  dedupKey?: string | null;
  createdAt: string;
  readAt: string | null;
};

export type GraduationNotification = AppNotification;

export const NOTIFICATION_CATEGORY = {
  graduation: "graduation_project",
  company: "company",
  chat: "chat",
  course: "course",
  ai: "ai",
  organization_event: "organization_event",
  organization_recruitment: "organization_recruitment",
} as const;

export async function getAllNotifications(take = 50): Promise<GraduationNotification[]> {
  const { data } = await api.get<GraduationNotification[]>("/notifications", {
    params: { take, category: "all" },
  });
  return Array.isArray(data) ? data : [];
}

export async function getAllNotificationsUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { category: "all" },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await api.post<{ marked: number }>("/notifications/read-all", null, {
    params: { category: "all" },
  });
  return typeof data?.marked === "number" ? data.marked : 0;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function getNotifications(take = 50, category?: string): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>("/notifications", {
    params: { take, ...(category ? { category } : {}) },
  });
  return Array.isArray(data) ? data : [];
}

export async function getNotificationsUnreadCount(category?: string): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: category ? { category } : {},
  });
  return typeof data?.count === "number" ? data.count : 0;
}

/** GET /api/notifications — company workspace notifications (same source as web dropdown). */
export async function getCompanyNotifications(take = 50): Promise<AppNotification[]> {
  return getNotifications(take, NOTIFICATION_CATEGORY.company);
}

/** GET /api/notifications/unread-count?category=company */
export async function getCompanyNotificationsUnreadCount(): Promise<number> {
  return getNotificationsUnreadCount(NOTIFICATION_CATEGORY.company);
}

/** POST /api/notifications/{id}/read */
export async function markCompanyNotificationRead(id: number): Promise<void> {
  return markNotificationRead(id);
}

/** POST /api/notifications/read-all?category=company */
export async function markCompanyNotificationsAllRead(): Promise<number> {
  const { data } = await api.post<{ marked: number }>("/notifications/read-all", null, {
    params: { category: NOTIFICATION_CATEGORY.company },
  });
  return typeof data?.marked === "number" ? data.marked : 0;
}
