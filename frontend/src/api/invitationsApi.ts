import api from "./axiosInstance";

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

/** GET /api/invitations/received — graduation project invites for current student. */
function normalizeReceivedInvitation(raw: Record<string, unknown>): ReceivedProjectInvitation | null {
  const invitationId = Number(raw.invitationId ?? raw.InvitationId ?? 0);
  const projectId = Number(raw.projectId ?? raw.ProjectId ?? 0);
  if (!invitationId || !projectId) return null;

  return {
    invitationId,
    projectId,
    projectName: String(raw.projectName ?? raw.ProjectName ?? ""),
    senderName: String(raw.senderName ?? raw.SenderName ?? ""),
    status: String(raw.status ?? raw.Status ?? ""),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ""),
  };
}

export async function getReceivedProjectInvitations(): Promise<ReceivedProjectInvitation[]> {
  const { data } = await api.get<unknown>("/invitations/received");
  const rawRows = Array.isArray(data) ? data : data != null && typeof data === "object" ? [data] : [];

  const rows: ReceivedProjectInvitation[] = [];
  for (const raw of rawRows) {
    if (!raw || typeof raw !== "object") continue;
    const normalized = normalizeReceivedInvitation(raw as Record<string, unknown>);
    if (normalized) rows.push(normalized);
  }

  if (import.meta.env.DEV) {
    console.info("[GraduationInvitationInbox]", {
      stage: "received_api_normalized",
      rawCount: rawRows.length,
      normalizedCount: rows.length,
      pendingCount: rows.filter((r) => r.status.toLowerCase() === "pending").length,
      rows: rows.map((r) => ({
        invitationId: r.invitationId,
        projectId: r.projectId,
        status: r.status,
      })),
    });
  }

  return rows;
}

/** POST /api/invitations/{id}/accept — receiver only. */
export async function acceptProjectInvitation(invitationId: number): Promise<void> {
  await api.post(`/invitations/${invitationId}/accept`);
}

/** POST /api/invitations/{id}/reject — receiver only. */
export async function rejectProjectInvitation(invitationId: number): Promise<void> {
  await api.post(`/invitations/${invitationId}/reject`);
}

/** POST /api/invitations/{id}/cancel — project owner only, pending invitations. */
export async function cancelProjectInvitation(invitationId: number): Promise<void> {
  await api.post(`/invitations/${invitationId}/cancel`);
}
