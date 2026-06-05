import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { setMustChangePassword } from "@/lib/authSession";

/** Ensures requests hit the ASP.NET API (/api/...) not the Vite dev server. */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const base = trimmed !== "" ? trimmed : "http://localhost:5262";
  const withoutTrailingSlash = base.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/api")
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers ?? {});
  if (config.data instanceof FormData) {
    headers.delete("Content-Type");
  }
  const token = localStorage.getItem("token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { code?: string } | undefined;
      if (
        error.response?.status === 403 &&
        data?.code === "PASSWORD_CHANGE_REQUIRED" &&
        typeof window !== "undefined"
      ) {
        setMustChangePassword(true);
        if (!window.location.pathname.startsWith("/change-password")) {
          window.location.assign("/change-password");
        }
      }
    }
    return Promise.reject(error);
  },
);

export function parseApiErrorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { message?: string; code?: string } | undefined;
      if (data?.code === "PASSWORD_CHANGE_REQUIRED") {
        return data.message ?? "You must set a new password before continuing.";
      }
    if (data && typeof data.message === "string" && data.message.trim() !== "") {
      return data.message;
    }
    const status = err.response?.status;
    if (status === 401) return "Session expired. Please sign in again.";
    if (status === 403) return "You do not have permission to access this resource.";
    if (status === 404) return "Resource not found.";
    if (status === 405) return "This action is not supported by the server. Restart the API to load the latest endpoints.";
    if (!err.response) {
      return "Cannot reach the server. Check that the API is running and the URL is correct.";
    }
    return err.message || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

export function getApiPublicOrigin(): string {
  const base = api.defaults.baseURL;
  if (!base) return typeof window !== "undefined" ? window.location.origin : "";
  try {
    const u = new URL(base, typeof window !== "undefined" ? window.location.href : "http://localhost");
    return u.origin;
  } catch {
    return base.replace(/\/api\/?$/i, "");
  }
}

export function resolveApiFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const origin = getApiPublicOrigin();
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${origin}${path}`;
}

export default api;
