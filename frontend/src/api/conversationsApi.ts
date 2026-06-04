import api from "./axiosInstance";

export type ConversationUser = {
  id: number;
  name: string;
  email: string;
};

export type ConversationMessage = {
  id: number;
  senderId: number;
  text: string;
  createdAt: string;
  edited: boolean;
  deleted: boolean;
  seen: boolean;
};

export type ConversationListItem = {
  id: number;
  title: string | null;
  type: string;
  courseTeamId: number | null;
  courseProjectId: number | null;
  users: ConversationUser[];
  participantCount: number;
  otherUser: ConversationUser | null;
  lastMessage: ConversationMessage | null;
  unseenCount: number;
};

export async function getConversations(): Promise<ConversationListItem[]> {
  const { data } = await api.get<ConversationListItem[]>("/conversations");
  return Array.isArray(data) ? data : [];
}

export function sumConversationUnseen(conversations: ConversationListItem[]): number {
  return conversations.reduce((sum, c) => sum + (c.unseenCount ?? 0), 0);
}

export type ConversationDetails = {
  id: number;
  title: string | null;
  type: string;
  courseTeamId: number | null;
  courseProjectId: number | null;
  participantCount: number;
  createdAt: string;
  users: ConversationUser[];
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

/** DELETE /api/conversations/{id} */
export async function deleteConversation(conversationId: number): Promise<void> {
  await api.delete(`/conversations/${conversationId}`);
}

/** POST /api/conversations/start/{targetUserId} */
export async function startConversation(targetUserId: number): Promise<number> {
  const { data } = await api.post<{ conversationId: number }>(
    `/conversations/start/${targetUserId}`,
  );
  return data.conversationId;
}
