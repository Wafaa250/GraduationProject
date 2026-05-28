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
    params: category ? { category } : undefined,
  });
  return typeof data?.count === "number" ? data.count : 0;
}

const DOCTOR_ACTIVITY_CATEGORIES = ["graduation_project", "course", "chat"] as const;

/** Unread notifications across categories used on the doctor hub. */
export async function getDoctorNotificationsUnreadCount(): Promise<number> {
  const counts = await Promise.all(
    DOCTOR_ACTIVITY_CATEGORIES.map((category) =>
      getGraduationNotificationsUnreadCount(category).catch(() => 0),
    ),
  );
  return counts.reduce((sum, n) => sum + n, 0);
}

/** Recent notifications merged from graduation, course, and chat categories. */
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
  const results = await Promise.all(
    DOCTOR_ACTIVITY_CATEGORIES.map((category) =>
      api
        .post<{ marked: number }>("/notifications/read-all", null, {
          params: { category },
        })
        .then((res) => (typeof res.data?.marked === "number" ? res.data.marked : 0))
        .catch(() => 0),
    ),
  );
  return results.reduce((sum, n) => sum + n, 0);
}
