import axios, { AxiosHeaders } from 'axios'

/**
 * Single axios client for the app. All API modules should import `api` from here
 * so every request gets the Bearer token from localStorage.
 */
const api = axios.create({
baseURL: 'http://192.168.1.107:5262/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('token')
  // Temporary debug — remove in production (avoid logging full JWT in shared builds)
  console.log('Token:', localStorage.getItem('token'))

  if (token) {
    // Axios v1 uses AxiosHeaders; merging ensures Authorization is actually sent
    const headers = AxiosHeaders.from(config.headers ?? {})
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }

  return config
})

/** Human-readable message from failed API calls (for UI + console) */
export function parseApiErrorMessage(err: any): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined

    if (data && typeof data.message === 'string' && data.message.trim() !== '') {
      return data.message
    }

    const status = err.response?.status

    if (status === 401) return 'Session expired. Please sign in again.'
    if (status === 403) return 'You do not have permission to access this resource.'
    if (status === 404) return 'Resource not found.'

    if (!err.response) {
      return 'Cannot reach the server. Check that the API is running and the URL is correct.'
    }

    return err.message || 'Request failed.'
  }

  if (err instanceof Error) return err.message

  return 'An unexpected error occurred.'
}
/** Origin hosting the API (e.g. static files under /project-files). */
export function getApiPublicOrigin(): string {
  const base = api.defaults.baseURL
  if (!base) return typeof window !== "undefined" ? window.location.origin : ""
  try {
    const u = new URL(base, typeof window !== "undefined" ? window.location.href : "http://localhost")
    return u.origin
  } catch {
    return base.replace(/\/api\/?$/i, "")
  }
}

/** Absolute URL for a path returned by the API (e.g. `/project-files/...`). */
export function resolveApiFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl
  const origin = getApiPublicOrigin()
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`
  return `${origin}${path}`
}

export default api
