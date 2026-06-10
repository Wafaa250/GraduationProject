import { router, type Href } from "expo-router";

import { startConversation } from "@/api/conversationsApi";
import { studentMessageThreadPath } from "@/lib/studentRoutes";

/** Start or open a direct conversation and navigate to the student thread (WEB parity). */
export async function openStudentDirectMessage(targetUserId: number): Promise<void> {
  const conversationId = await startConversation(targetUserId);
  router.push(studentMessageThreadPath(conversationId) as Href);
}
