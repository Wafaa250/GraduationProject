import { apiClient } from '@/shared/api/client'
import type { DashboardSummary, DashboardProject, ProfileStrength, SuggestedTeammate } from '@/shared/api/types/dashboard'

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),

  getSuggestedTeammates: () =>
    apiClient.get<SuggestedTeammate[]>('/dashboard/teammates').then((r) => r.data),

  getProfileStrength: () =>
    apiClient.get<ProfileStrength>('/dashboard/profile-strength').then((r) => r.data),

  getMyProject: () =>
    apiClient.get<DashboardProject | null>('/dashboard/my-project').then((r) => r.data),
}
