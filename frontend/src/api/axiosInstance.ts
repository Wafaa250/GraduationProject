import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5262/api",
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

export function parseApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data && typeof data.message === "string" && data.message.trim() !== "") {
      return data.message;
    }
    const status = err.response?.status;
    if (status === 401) return "Session expired. Please sign in again.";
    if (status === 403) return "You do not have permission to access this resource.";
    if (status === 404) return "Resource not found.";
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
