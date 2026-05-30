import type { ConversationListItem } from "@/api/conversationsApi";
import { startConversation } from "@/api/conversationsApi";

/** Find an existing 1:1 direct message conversation with a user. */
export function findDirectConversationWithUser(
  conversations: ConversationListItem[],
  targetUserId: number,
  currentUserId: number | null,
): number | null {
  if (!currentUserId) return null;
  const match = conversations.find(
    (c) =>
      c.courseTeamId == null &&
      c.participantCount === 2 &&
      c.users.some((u) => u.id === targetUserId) &&
      c.users.some((u) => u.id === currentUserId),
  );
  return match?.id ?? null;
}

/** Open an existing DM or create one, then return the conversation id. */
export async function openOrStartDirectConversation(
  conversations: ConversationListItem[],
  targetUserId: number,
  currentUserId: number | null,
): Promise<number> {
  const existing = findDirectConversationWithUser(conversations, targetUserId, currentUserId);
  if (existing != null) return existing;
  return startConversation(targetUserId);
}

export function userSearchRoleLabel(role: string): string {
  const normalized = role.trim().toLowerCase();
  if (normalized === "doctor") return "Doctor";
  if (normalized === "student") return "Student";
  return role;
}
