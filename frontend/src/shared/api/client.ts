import axios from 'axios'
import { getStoredToken, clearStoredSession } from '@/shared/lib/authStorage'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5262/api'

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearStoredSession()
      window.dispatchEvent(new CustomEvent('skillswap:session-expired'))
    }
    return Promise.reject(error)
  },
)
