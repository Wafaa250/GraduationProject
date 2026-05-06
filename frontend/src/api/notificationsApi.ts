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
