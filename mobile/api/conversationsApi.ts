import api from "./axiosInstance";

export type ConversationUserDto = {
  id: number;
  name?: string;
  email?: string;
};

export type ApiMessageDto = {
  id: number;
  senderId: number;
  text: string;
  createdAt: string;
  edited?: boolean;
  deleted?: boolean;
  seen?: boolean;
};

export type ConversationListItemDto = {
  id: number;
  title?: string | null;
  courseTeamId?: number | null;
  users?: ConversationUserDto[];
  otherUser?: { id: number; name?: string };
  lastMessage?: ApiMessageDto | null;
  unseenCount?: number;
};

export type ConversationDetailsDto = {
  id: number;
  title?: string | null;
  courseTeamId?: number | null;
  users: ConversationUserDto[];
  messages: ApiMessageDto[];
};

export async function fetchConversationsForCurrentUser(): Promise<ConversationListItemDto[]> {
  const { data } = await api.get<ConversationListItemDto[]>("/conversations");
  return Array.isArray(data) ? data : [];
}

export async function fetchConversationDetails(
  conversationId: number,
  opts?: { page?: number; pageSize?: number },
): Promise<ConversationDetailsDto> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 100;
  const { data } = await api.get<ConversationDetailsDto>(`/conversations/${conversationId}`, {
    params: { page, pageSize },
  });
  return data;
}

export async function startConversationWithUser(targetUserId: number): Promise<number> {
  const { data } = await api.post<{ conversationId?: number; id?: number }>(
    `/conversations/start/${targetUserId}`,
  );
  const conversationId = data?.conversationId ?? data?.id;
  if (typeof conversationId !== "number" || !Number.isFinite(conversationId) || conversationId <= 0) {
    throw new Error("Unable to start conversation.");
  }
  return conversationId;
}

export async function deleteConversation(conversationId: number): Promise<void> {
  await api.delete(`/conversations/${conversationId}`);
}
