import { getApiPublicOrigin } from "@/api/axiosInstance";

/**
 * Same host as REST API, path `/hubs/notifications` (matches web `getNotificationsHubUrl`).
 */
export function getNotificationsHubUrl(): string {
  const fromEnv =
    typeof process !== "undefined" && typeof process.env?.EXPO_PUBLIC_NOTIFICATIONS_HUB_URL === "string"
      ? process.env.EXPO_PUBLIC_NOTIFICATIONS_HUB_URL.trim()
      : "";
  if (fromEnv !== "") {
    return fromEnv;
  }

  const origin = getApiPublicOrigin();
  if (!origin) {
    return "http://localhost:5262/hubs/notifications";
  }
  return `${origin.replace(/\/$/, "")}/hubs/notifications`;
}
