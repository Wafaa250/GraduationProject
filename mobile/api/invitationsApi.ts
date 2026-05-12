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

const INVITATION_STATUSES: InvitationStatus[] = [
  'pending',
  'accepted',
  'rejected',
  'cancelled',
  'expired',
]

function coalesceString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim()
  }
  return ''
}

function coalesceFiniteNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return null
}

function normalizeInvitationStatus(raw: string): InvitationStatus {
  const s = raw.trim().toLowerCase()
  return (INVITATION_STATUSES.includes(s as InvitationStatus) ? s : 'pending') as InvitationStatus
}

/** Unwrap common API shapes so we always iterate real rows (matches web `res.data` array). */
function extractReceivedInvitationsRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data

  if (typeof data === 'string') {
    const t = data.trim()
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        return extractReceivedInvitationsRows(JSON.parse(t) as unknown)
      } catch {
        return []
      }
    }
    return []
  }

  if (data !== null && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const keys = ['items', 'results', 'data', 'value', 'invitations', 'received'] as const
    for (const k of keys) {
      const v = o[k]
      if (Array.isArray(v)) return v
    }
  }

  return []
}

/**
 * Parses GET /api/invitations/received payloads defensively (camelCase / PascalCase, nullable strings).
 * Exported for reuse by dashboards; prefer `getReceivedInvitations()` for fetching.
 */
export function parseReceivedInvitationsResponse(data: unknown): ReceivedInvitation[] {
  const rows = extractReceivedInvitationsRows(data)
  const out: ReceivedInvitation[] = []

  for (const raw of rows) {
    if (raw === null || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>

    const invitationId = coalesceFiniteNumber(
      o.invitationId,
      o.InvitationId,
      o.id,
      o.Id,
    )
    const projectId = coalesceFiniteNumber(
      o.projectId,
      o.ProjectId,
      o.studentProjectId,
      o.StudentProjectId,
    )
    if (invitationId === null || projectId === null) continue

    const projectName = coalesceString(o.projectName, o.ProjectName) || '—'
    const senderName = coalesceString(o.senderName, o.SenderName) || '—'
    const createdRaw = coalesceString(o.createdAt, o.CreatedAt)
    const statusRaw = coalesceString(o.status, o.Status)

    out.push({
      invitationId,
      projectId,
      projectName,
      senderName,
      status: normalizeInvitationStatus(statusRaw || 'pending'),
      createdAt: createdRaw || '',
    })
  }

  return out
}

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
  const res = await api.get<unknown>('/invitations/received')
  return parseReceivedInvitationsResponse(res.data)
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