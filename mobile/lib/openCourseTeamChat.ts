import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getOrCreateCourseTeamConversation } from "@/api/courseTeamConversationsApi";
import { doctorMessageThreadPath } from "@/lib/doctorRoutes";

export async function openCourseTeamChat(teamId: number, push: (href: string) => void): Promise<void> {
  try {
    const { conversationId } = await getOrCreateCourseTeamConversation(teamId);
    push(doctorMessageThreadPath(conversationId));
  } catch (err) {
    throw new Error(parseApiErrorMessage(err) || "Could not open team chat.");
  }
}
