import api from "./axiosInstance";

export type GraduationNotification = {
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

const ALL_CATEGORIES = [
  "graduation_project",
  "course",
  "chat",
  "ai",
  "organization_event",
  "organization_recruitment",
] as const;

/** GET /api/notifications — all categories for current user. */
export async function getAllNotifications(take = 50): Promise<GraduationNotification[]> {
  const { data } = await api.get<GraduationNotification[]>("/notifications", {
    params: { take, category: "all" },
  });
  return Array.isArray(data) ? data : [];
}

/** GET /api/notifications/unread-count — all categories. */
export async function getAllNotificationsUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { category: "all" },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

/** POST /api/notifications/read-all — all categories. */
export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await api.post<{ marked: number }>("/notifications/read-all", null, {
    params: { category: "all" },
  });
  return typeof data?.marked === "number" ? data.marked : 0;
}

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
export async function getGraduationNotificationsUnreadCount(
  category?: string,
): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: category ? { category } : { category: "all" },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

const DOCTOR_ACTIVITY_CATEGORIES = ["graduation_project", "course", "chat", "ai"] as const;

/** Unread notifications across categories used on the doctor hub. */
export async function getDoctorNotificationsUnreadCount(): Promise<number> {
  return getAllNotificationsUnreadCount();
}

/** Recent notifications merged from hub categories. */
export async function getDoctorNotificationsForActivity(
  takePerCategory = 15,
): Promise<GraduationNotification[]> {
  const batches = await Promise.all(
    DOCTOR_ACTIVITY_CATEGORIES.map((category) =>
      api
        .get<GraduationNotification[]>("/notifications", {
          params: { take: takePerCategory, category },
        })
        .then((res) => (Array.isArray(res.data) ? res.data : []))
        .catch(() => [] as GraduationNotification[]),
    ),
  );
  return batches
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

/** POST /api/notifications/{id}/read */
export async function markGraduationNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

/** POST /api/notifications/read-all — all doctor hub notification categories. */
export async function markDoctorNotificationsAllRead(): Promise<number> {
  return markAllNotificationsRead();
}

export { ALL_CATEGORIES };
