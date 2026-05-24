import api from "./axiosInstance";

export type SentProjectInvitation = {
  invitationId: number;
  receiverId: number;
  receiverName: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired" | string;
  createdAt: string;
};

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
