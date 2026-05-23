import { apiClient } from '@/shared/api/client'
import type { StudentMe } from '@/shared/api/types/me'

export const meApi = {
  getMe: () => apiClient.get<StudentMe>('/me').then((r) => r.data),
}
