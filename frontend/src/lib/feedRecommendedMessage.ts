import type { NavigateFunction } from "react-router-dom";
import { startConversation } from "@/api/conversationsApi";
import { studentMessageThreadPath } from "@/routes/paths";

/** Opens or creates a direct conversation, then navigates to the student messages thread. */
export async function openFeedRecommendedMessage(
  targetUserId: number,
  navigate: NavigateFunction,
): Promise<void> {
  const conversationId = await startConversation(targetUserId);
  navigate(studentMessageThreadPath(conversationId), { state: { focusComposer: true } });
}
