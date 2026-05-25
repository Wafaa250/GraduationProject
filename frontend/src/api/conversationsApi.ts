import api from "./axiosInstance";

export type ConversationListItem = {
  id: number;
  title: string | null;
  courseTeamId: number | null;
  participantCount: number;
  unseenCount: number;
};

export async function getConversations(): Promise<ConversationListItem[]> {
  const { data } = await api.get<ConversationListItem[]>("/conversations");
  return Array.isArray(data) ? data : [];
}

export function sumConversationUnseen(conversations: ConversationListItem[]): number {
  return conversations.reduce((sum, c) => sum + (c.unseenCount ?? 0), 0);
}

export type ConversationMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  sentAt: string;
  editedAt: string | null;
  isMine: boolean;
};

export type ConversationDetails = {
  id: number;
  title: string | null;
  users: { userId: number; name: string }[];
  messages: ConversationMessage[];
};

/** GET /api/conversations/{id} */
export async function getConversationById(
  id: number,
  page = 1,
  pageSize = 100,
): Promise<ConversationDetails> {
  const { data } = await api.get<ConversationDetails>(`/conversations/${id}`, {
    params: { page, pageSize },
  });
  return data;
}

/** POST /api/messages */
export async function sendMessage(conversationId: number, text: string): Promise<void> {
  await api.post("/messages", { conversationId, text });
}

/** POST /api/messages/{conversationId}/seen */
export async function markConversationSeen(conversationId: number): Promise<void> {
  await api.post(`/messages/${conversationId}/seen`);
}
