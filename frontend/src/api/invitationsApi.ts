import api from "./axiosInstance";

export type InvitationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired";

/** GET /api/invitations/received */
export type ReceivedProjectInvitation = {
  invitationId: number;
  projectId: number;
  projectName: string;
  senderName: string;
  status: InvitationStatus | string;
  createdAt: string;
};

export type SentProjectInvitation = {
  invitationId: number;
  receiverId: number;
  receiverName: string;
  status: InvitationStatus | string;
  createdAt: string;
};

/** GET /api/invitations/received — all statuses; UI should filter to pending. */
export async function getReceivedInvitations(): Promise<ReceivedProjectInvitation[]> {
  const { data } = await api.get<ReceivedProjectInvitation[]>("/invitations/received");
  return Array.isArray(data) ? data : [];
}

/** POST /api/invitations/{id}/accept — receiver joins the graduation project team. */
export async function acceptInvitation(id: number): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`/invitations/${id}/accept`);
  return data;
}

/** POST /api/invitations/{id}/reject — receiver declines the invitation. */
export async function rejectInvitation(id: number): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`/invitations/${id}/reject`);
  return data;
}

export async function getSentProjectInvitations(
  projectId: number,
): Promise<SentProjectInvitation[]> {
  const { data } = await api.get<SentProjectInvitation[]>(`/invitations/sent/${projectId}`);
  return Array.isArray(data) ? data : [];
}

/** POST /api/invitations/{id}/cancel — project owner only, pending invitations. */
export async function cancelProjectInvitation(invitationId: number): Promise<void> {
  await api.post(`/invitations/${invitationId}/cancel`);
}
