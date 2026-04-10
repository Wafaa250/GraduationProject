import axios, { AxiosHeaders } from 'axios'

/**
 * Single axios client for the app. All API modules should import `api` from here
 * so every request gets the Bearer token from localStorage.
 */
const api = axios.create({
  baseURL: 'http://localhost:5262/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
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
export function parseApiErrorMessage(err: unknown): string {
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

export default api
