import { useEffect } from "react";
import type { ConversationDetails } from "@/api/conversationsApi";
import { subscribeReceiveMessage } from "@/lib/notificationsHub";

type LiveMessagePayload = {
  conversationId: number;
  id: number;
  senderId: number;
  text: string;
  createdAt: string;
};

export function useLiveConversationMessages(
  conversationId: number | null,
  onMessage: (payload: LiveMessagePayload) => void,
) {
  useEffect(() => {
    if (conversationId == null) return;

    return subscribeReceiveMessage((payload) => {
      if (payload.conversationId !== conversationId) return;
      onMessage(payload);
    });
  }, [conversationId, onMessage]);
}

export function appendLiveMessage(
  thread: ConversationDetails | null,
  payload: LiveMessagePayload,
  currentUserId: number | null,
): ConversationDetails | null {
  if (!thread || thread.id !== payload.conversationId) return thread;
  if (thread.messages.some((m) => m.id === payload.id)) return thread;

  return {
    ...thread,
    messages: [
      ...thread.messages,
      {
        id: payload.id,
        senderId: payload.senderId,
        text: payload.text,
        createdAt: payload.createdAt,
        edited: false,
        deleted: false,
        seen: currentUserId != null && payload.senderId === currentUserId,
      },
    ],
  };
}
