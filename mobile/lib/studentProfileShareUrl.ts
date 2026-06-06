import { getApiBaseUrl } from "@/utils/apiBaseUrl";

/** Public web profile URL for Share Profile (matches web `/students/:userId`). */
export function studentProfileShareUrl(userId: number): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim();
  if (fromEnv) {
    return `${fromEnv.replace(/\/+$/, "")}/students/${userId}`;
  }

  const apiBase = getApiBaseUrl();
  const origin = apiBase.replace(/\/api\/?$/i, "");
  try {
    const url = new URL(origin);
    if (url.port === "5262") url.port = "5173";
    return `${url.origin}/students/${userId}`;
  } catch {
    return `http://localhost:5173/students/${userId}`;
  }
}
