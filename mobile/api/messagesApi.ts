import api from "./axiosInstance";

import type { ApiMessageDto } from "./conversationsApi";

export async function sendMessage(conversationId: number, text: string): Promise<ApiMessageDto> {
  const { data } = await api.post<ApiMessageDto>("/messages", {
    conversationId,
    text,
  });
  return data;
}

export async function editMessage(messageId: number, text: string): Promise<ApiMessageDto> {
  const { data } = await api.put<ApiMessageDto>(`/messages/${messageId}`, { text });
  return data;
}

export async function unsendMessage(messageId: number): Promise<ApiMessageDto> {
  const { data } = await api.delete<ApiMessageDto>(`/messages/${messageId}`);
  return data;
}

export async function markConversationMessagesSeen(conversationId: number): Promise<void> {
  await api.post(`/messages/${conversationId}/seen`);
}
