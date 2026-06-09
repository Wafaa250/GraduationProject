import api from "@/api/axiosInstance";

export type SentProjectInvitation = {
  invitationId: number;
  receiverId: number;
  receiverName: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired" | string;
  createdAt: string;
};

export type ReceivedProjectInvitation = {
  invitationId: number;
  projectId: number;
  projectName: string;
  senderName: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired" | string;
  createdAt: string;
};

export async function getSentProjectInvitations(
  projectId: number,
): Promise<SentProjectInvitation[]> {
  const { data } = await api.get<SentProjectInvitation[]>(`/invitations/sent/${projectId}`);
  return Array.isArray(data) ? data : [];
}

export async function getReceivedProjectInvitations(): Promise<ReceivedProjectInvitation[]> {
  const { data } = await api.get<unknown>("/invitations/received");
  const rawRows = Array.isArray(data) ? data : data != null && typeof data === "object" ? [data] : [];
  return rawRows.filter((row): row is ReceivedProjectInvitation => {
    if (!row || typeof row !== "object") return false;
    const o = row as Record<string, unknown>;
    return Number(o.invitationId ?? o.InvitationId) > 0;
  }).map((row) => {
    const o = row as Record<string, unknown>;
    return {
      invitationId: Number(o.invitationId ?? o.InvitationId),
      projectId: Number(o.projectId ?? o.ProjectId),
      projectName: String(o.projectName ?? o.ProjectName ?? ""),
      senderName: String(o.senderName ?? o.SenderName ?? ""),
      status: String(o.status ?? o.Status ?? "") as ReceivedProjectInvitation["status"],
      createdAt: String(o.createdAt ?? o.CreatedAt ?? ""),
    };
  });
}

export async function acceptProjectInvitation(invitationId: number): Promise<void> {
  await api.post(`/invitations/${invitationId}/accept`);
}

export async function rejectProjectInvitation(invitationId: number): Promise<void> {
  await api.post(`/invitations/${invitationId}/reject`);
}

export async function cancelProjectInvitation(invitationId: number): Promise<void> {
  await api.post(`/invitations/${invitationId}/cancel`);
}
