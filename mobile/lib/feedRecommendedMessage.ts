import { parseApiErrorMessage } from "@/api/axiosInstance";
import { openStudentDirectMessage } from "@/lib/openStudentDirectMessage";

export async function openFeedRecommendedMessage(targetUserId: number): Promise<void> {
  await openStudentDirectMessage(targetUserId);
}

export { parseApiErrorMessage };
