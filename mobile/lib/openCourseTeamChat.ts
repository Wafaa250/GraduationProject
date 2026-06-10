import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getOrCreateCourseTeamConversation } from "@/api/courseTeamConversationsApi";
import { doctorMessageThreadPath } from "@/lib/doctorRoutes";

/** WEB parity: role-specific thread path after POST /course-teams/{teamId}/conversation. */
export async function openCourseTeamChat(
  teamId: number,
  push: (href: string) => void,
  messageThreadPath: (conversationId: number) => string = doctorMessageThreadPath,
): Promise<void> {
  try {
    const { conversationId } = await getOrCreateCourseTeamConversation(teamId);
    push(messageThreadPath(conversationId));
  } catch (err) {
    throw new Error(parseApiErrorMessage(err) || "Could not open team chat.");
  }
}
