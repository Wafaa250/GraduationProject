import { apiClient } from '@/shared/api/client'

export const notificationsApi = {
  getUnreadCount: (category?: string) =>
    apiClient
      .get<{ count: number }>('/notifications/unread-count', {
        params: category ? { category } : undefined,
      })
      .then((r) => r.data.count),
}
