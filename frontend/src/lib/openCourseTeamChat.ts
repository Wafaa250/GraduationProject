import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getOrCreateCourseTeamConversation } from "@/api/courseTeamConversationsApi";

export async function openCourseTeamChat(
  teamId: number,
  navigate: (path: string) => void,
  messageThreadPath: (conversationId: number) => string,
): Promise<void> {
  try {
    const { conversationId } = await getOrCreateCourseTeamConversation(teamId);
    navigate(messageThreadPath(conversationId));
  } catch (err) {
    throw new Error(parseApiErrorMessage(err) || "Could not open team chat.");
  }
}
