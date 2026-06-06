import { router, type Href } from "expo-router";

import { startConversation } from "@/api/conversationsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";

export async function openFeedRecommendedMessage(targetUserId: number): Promise<void> {
  const conversationId = await startConversation(targetUserId);
  router.push(`/messages/${conversationId}` as Href);
}

export { parseApiErrorMessage };
