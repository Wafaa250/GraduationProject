import api from "./axiosInstance";

export type GraduationNotificationDto = {
  id: number;
  category?: string;
  title: string;
  body: string;
  eventType: string;
  projectId: number | null;
  createdAt: string;
  readAt: string | null;
};

const GRAD_CATEGORY = "graduation_project";
const COURSE_CATEGORY = "course";

export function mergeNotificationRows(
  current: GraduationNotificationDto[],
  incoming: GraduationNotificationDto[],
): GraduationNotificationDto[] {
  const map = new Map<number, GraduationNotificationDto>();
  for (const item of current) map.set(item.id, item);
  for (const item of incoming) {
    const prev = map.get(item.id);
    map.set(item.id, prev ? { ...prev, ...item } : item);
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function fetchGraduationNotifications(take = 50): Promise<GraduationNotificationDto[]> {
  const { data } = await api.get<GraduationNotificationDto[]>("/notifications", {
    params: { take, category: GRAD_CATEGORY },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadGraduationNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { _t: Date.now(), category: GRAD_CATEGORY },
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

export async function fetchCourseNotifications(take = 50): Promise<GraduationNotificationDto[]> {
  const { data } = await api.get<GraduationNotificationDto[]>("/notifications", {
    params: { take, category: COURSE_CATEGORY },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadCourseNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { _t: Date.now(), category: COURSE_CATEGORY },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

export async function markAllCourseNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all", null, {
    params: { category: COURSE_CATEGORY },
  });
}

export async function fetchChatNotifications(take = 40): Promise<GraduationNotificationDto[]> {
  const { data } = await api.get<GraduationNotificationDto[]>("/notifications", {
    params: { take, category: "chat" },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadChatNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { _t: Date.now(), category: "chat" },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

export async function markAllChatNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all", null, {
    params: { category: "chat" },
  });
}

export async function markChatScopeRead(scope: string): Promise<void> {
  await api.post("/notifications/read-scope", null, {
    params: { category: "chat", scope },
  });
}

const OPTIONAL_INBOX_CATEGORIES = ["invitations", "invitation", "system", "announcement"] as const;

/** Merged inbox: graduation, course, chat, plus any optional categories the backend may use. */
export async function fetchMergedNotificationsForInbox(takePerCategory = 40): Promise<GraduationNotificationDto[]> {
  const [grad, course, chat] = await Promise.all([
    fetchGraduationNotifications(takePerCategory),
    fetchCourseNotifications(takePerCategory),
    fetchChatNotifications(takePerCategory),
  ]);
  let merged = [...grad, ...course, ...chat];
  const settled = await Promise.allSettled(
    OPTIONAL_INBOX_CATEGORIES.map((c) => fetchNotificationsByCategory(c, takePerCategory)),
  );
  for (const s of settled) {
    if (s.status === "fulfilled" && Array.isArray(s.value)) {
      merged = mergeNotificationRows(merged, s.value);
    }
  }
  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Sum of unread counts across graduation, course, and chat categories. */
export async function fetchTotalUnreadNotificationCount(): Promise<number> {
  const [g, c, ch] = await Promise.all([
    fetchUnreadGraduationNotificationCount(),
    fetchUnreadCourseNotificationCount(),
    fetchUnreadChatNotificationCount(),
  ]);
  return g + c + ch;
}

/** Generic fetch for any notification category string supported by the API. */
export async function fetchNotificationsByCategory(
  category: string,
  take = 50,
): Promise<GraduationNotificationDto[]> {
  const c = category.trim();
  if (!c) return [];
  const { data } = await api.get<GraduationNotificationDto[]>("/notifications", {
    params: { take, category: c },
  });
  return Array.isArray(data) ? data : [];
}

/** Mark every notification read in graduation, course, and chat (parallel). */
export async function markAllNotificationsReadAllCategories(): Promise<void> {
  await Promise.all([
    markAllGraduationNotificationsRead(),
    markAllCourseNotificationsRead(),
    markAllChatNotificationsRead(),
  ]);
}
