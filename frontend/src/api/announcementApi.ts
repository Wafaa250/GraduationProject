import api from './axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Announcement {
  id: number
  title: string
  content: string
  doctorName: string
  createdAt: string
  updatedAt: string | null
}

export interface CreateAnnouncementPayload {
  title: string
  content: string
}

export interface UpdateAnnouncementPayload {
  title?: string
  content?: string
}

// ─── API Calls ────────────────────────────────────────────────────────────────

// Get all announcements for a channel
export const getChannelAnnouncements = async (channelId: number): Promise<Announcement[]> => {
  const response = await api.get(`/channels/${channelId}/announcements`)
  return response.data
}

// Create a new announcement
export const createAnnouncement = async (
  channelId: number,
  payload: CreateAnnouncementPayload
): Promise<Announcement> => {
  const response = await api.post(`/channels/${channelId}/announcements`, payload)
  return response.data
}

// Update an announcement
export const updateAnnouncement = async (
  channelId: number,
  announcementId: number,
  payload: UpdateAnnouncementPayload
): Promise<Announcement> => {
  const response = await api.put(
    `/channels/${channelId}/announcements/${announcementId}`,
    payload
  )
  return response.data
}

// Delete an announcement
export const deleteAnnouncement = async (
  channelId: number,
  announcementId: number
): Promise<void> => {
  await api.delete(`/channels/${channelId}/announcements/${announcementId}`)
}
