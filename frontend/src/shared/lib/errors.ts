import { isAxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; title?: string } | undefined
    if (typeof data?.message === 'string') return data.message
    if (typeof data?.title === 'string') return data.title
    if (error.response?.status === 401) return 'Invalid email or password.'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
