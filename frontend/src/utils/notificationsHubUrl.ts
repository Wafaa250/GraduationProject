import api from "../api/axiosInstance";

/**
 * Same host as REST API, path `/hubs/notifications`.
 */
export function getNotificationsHubUrl(): string {
  const fromEnv = import.meta.env.VITE_NOTIFICATIONS_HUB_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.trim();
  }

  const base = api.defaults.baseURL ?? "";
  try {
    const u = new URL(base, typeof window !== "undefined" ? window.location.href : "http://localhost");
    return `${u.origin}/hubs/notifications`;
  } catch {
    return "http://localhost:5262/hubs/notifications";
  }
}
