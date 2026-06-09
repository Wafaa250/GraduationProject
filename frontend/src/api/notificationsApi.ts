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

const ALL_CATEGORIES = [
  "graduation_project",
  "course",
  "chat",
  "ai",
  "organization_event",
  "organization_recruitment",
  "company",
] as const;

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

/** GET /api/notifications — all categories for current user. */
function normalizeNotification(raw: Record<string, unknown>): GraduationNotification | null {
  const id = Number(raw.id ?? raw.Id);
  if (!Number.isFinite(id)) return null;
  const projectRaw = raw.projectId ?? raw.ProjectId;
  return {
    id,
    category: String(raw.category ?? raw.Category ?? ""),
    title: String(raw.title ?? raw.Title ?? ""),
    body: String(raw.body ?? raw.Body ?? ""),
    eventType: String(raw.eventType ?? raw.EventType ?? ""),
    projectId: projectRaw != null ? Number(projectRaw) : null,
    dedupKey: (raw.dedupKey ?? raw.DedupKey ?? null) as string | null,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ""),
    readAt: (raw.readAt ?? raw.ReadAt ?? null) as string | null,
  };
}

export async function getAllNotifications(take = 50): Promise<GraduationNotification[]> {
  const { data } = await api.get<unknown>("/notifications", {
    params: { take, category: "all" },
  });
  if (!Array.isArray(data)) return [];
  const rows: GraduationNotification[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const normalized = normalizeNotification(raw as Record<string, unknown>);
    if (normalized) rows.push(normalized);
  }
  return rows;
}

/** GET /api/notifications/unread-count */
export async function getNotificationsUnreadCount(category?: string): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: category ? { category } : {},
  });
  return typeof data?.count === "number" ? data.count : 0;
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
export async function getGraduationNotifications(take = 50): Promise<AppNotification[]> {
  return getNotifications(take, NOTIFICATION_CATEGORY.graduation);
}

/** GET /api/notifications/unread-count */
export async function getGraduationNotificationsUnreadCount(
  category?: string,
): Promise<number> {
  if (category) {
    return getNotificationsUnreadCount(category);
  }
  return getNotificationsUnreadCount(NOTIFICATION_CATEGORY.graduation);
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
export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

/** POST /api/notifications/{id}/read */
export async function markGraduationNotificationRead(id: number): Promise<void> {
  return markNotificationRead(id);
}

/** POST /api/notifications/read-all — all doctor hub notification categories. */
export async function markDoctorNotificationsAllRead(): Promise<number> {
  return markAllNotificationsRead();
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

export { ALL_CATEGORIES };
