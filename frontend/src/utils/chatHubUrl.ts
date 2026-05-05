import api from "../api/axiosInstance";

/**
 * Same host as REST API, path `/hubs/chat`. Override with `VITE_SIGNALR_HUB_URL` if needed.
 */
export function getChatHubUrl(): string {
  const fromEnv = import.meta.env.VITE_SIGNALR_HUB_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.trim();
  }
  const base = api.defaults.baseURL ?? "";
  try {
    const u = new URL(base, typeof window !== "undefined" ? window.location.href : "http://localhost");
    return `${u.origin}/hubs/chat`;
  } catch {
    return "http://localhost:5262/hubs/chat";
  }
}
