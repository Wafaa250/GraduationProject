// src/api/invitationsApi.ts
// Typed API layer for the invitation system.
// All calls go through the shared axiosInstance (token injected automatically).
//
// Backend status values (from ProjectInvitation.cs):
//   "pending" | "accepted" | "rejected" | "cancelled" | "expired"

import api from './axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired'

/**
 * An invitation received by the current student.
 * Returned by GET /api/invitations/received
 */
export interface ReceivedInvitation {
  invitationId: number
  projectId:    number
  projectName:  string
  senderName:   string
  status:       InvitationStatus
  createdAt:    string
}

/**
 * An invitation sent from the current student's project.
 * Returned by GET /api/invitations/sent/{projectId}
 */
export interface SentInvitation {
  invitationId: number
  receiverId:   number
  receiverName: string
  status:       InvitationStatus
  createdAt:    string
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/invitations/received
 * Returns all invitations received by the current student (all statuses).
 */
export async function getReceivedInvitations(): Promise<ReceivedInvitation[]> {
  const res = await api.get<ReceivedInvitation[]>('/invitations/received')
  return res.data
}

/**
 * GET /api/invitations/sent/{projectId}
 * Returns all invitations sent from a project. Owner only.
 */
export async function getSentInvitations(projectId: number): Promise<SentInvitation[]> {
  const res = await api.get<SentInvitation[]>(`/invitations/sent/${projectId}`)
  return res.data
}

/**
 * POST /api/invitations/{id}/accept
 * Receiver accepts → added to project as member.
 * Also expires other pending invitations for that project.
 */
export async function acceptInvitation(id: number): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(`/invitations/${id}/accept`)
  return res.data
}

/**
 * POST /api/invitations/{id}/reject
 * Receiver rejects the invitation.
 */
export async function rejectInvitation(id: number): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(`/invitations/${id}/reject`)
  return res.data
}

/**
 * POST /api/invitations/{id}/cancel
 * Sender (project owner) cancels a pending invitation.
 */
export async function cancelInvitation(id: number): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(`/invitations/${id}/cancel`)
  return res.data
}

/**
 * POST /api/graduation-projects/{projectId}/invite/{receiverProfileId}
 * Owner sends an invitation to a student.
 * receiverProfileId = StudentProfile.Id (not userId)
 */
export async function sendInvitation(
  projectId: number,
  receiverProfileId: number
): Promise<{ message: string; invitationId: number }> {
  const res = await api.post(
    `/graduation-projects/${projectId}/invite/${receiverProfileId}`
  )
  return res.data
}
