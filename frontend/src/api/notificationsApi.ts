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
export const ORGANIZATION_EVENT_CATEGORY = "organization_event";
export const ORGANIZATION_RECRUITMENT_CATEGORY = "organization_recruitment";

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

export async function fetchOrganizationEventNotifications(take = 50): Promise<GraduationNotificationDto[]> {
  const { data } = await api.get<GraduationNotificationDto[]>("/notifications", {
    params: { take, category: ORGANIZATION_EVENT_CATEGORY },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadOrganizationEventNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { _t: Date.now(), category: ORGANIZATION_EVENT_CATEGORY },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

export async function markAllOrganizationEventNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all", null, {
    params: { category: ORGANIZATION_EVENT_CATEGORY },
  });
}

export async function fetchOrganizationRecruitmentNotifications(
  take = 50,
): Promise<GraduationNotificationDto[]> {
  const { data } = await api.get<GraduationNotificationDto[]>("/notifications", {
    params: { take, category: ORGANIZATION_RECRUITMENT_CATEGORY },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadOrganizationRecruitmentNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count", {
    params: { _t: Date.now(), category: ORGANIZATION_RECRUITMENT_CATEGORY },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return typeof data?.count === "number" ? data.count : 0;
}

export async function markAllOrganizationRecruitmentNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all", null, {
    params: { category: ORGANIZATION_RECRUITMENT_CATEGORY },
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

/** Merged inbox: graduation, course, chat, and organization events. */
export async function fetchMergedNotificationsForInbox(
  takePerCategory = 40,
): Promise<GraduationNotificationDto[]> {
  const [grad, course, chat, org, recruitment] = await Promise.all([
    fetchGraduationNotifications(takePerCategory),
    fetchCourseNotifications(takePerCategory),
    fetchChatNotifications(takePerCategory),
    fetchOrganizationEventNotifications(takePerCategory),
    fetchOrganizationRecruitmentNotifications(takePerCategory),
  ]);
  return mergeNotificationRows(
    mergeNotificationRows(mergeNotificationRows(grad, course), mergeNotificationRows(chat, org)),
    recruitment,
  );
}

export async function fetchTotalUnreadNotificationCount(): Promise<number> {
  const [grad, course, chat, org, recruitment] = await Promise.all([
    fetchUnreadGraduationNotificationCount(),
    fetchUnreadCourseNotificationCount(),
    fetchUnreadChatNotificationCount(),
    fetchUnreadOrganizationEventNotificationCount(),
    fetchUnreadOrganizationRecruitmentNotificationCount(),
  ]);
  return grad + course + chat + org + recruitment;
}

/** Mark every notification read across student inbox categories. */
export async function markAllNotificationsReadAllCategories(): Promise<void> {
  await Promise.all([
    markAllGraduationNotificationsRead(),
    markAllCourseNotificationsRead(),
    markAllChatNotificationsRead(),
    markAllOrganizationEventNotificationsRead(),
    markAllOrganizationRecruitmentNotificationsRead(),
  ]);
}
