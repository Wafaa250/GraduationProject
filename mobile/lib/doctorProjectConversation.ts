import type { ConversationListItem } from "@/api/conversationsApi";

/** Finds the best existing conversation for a supervised graduation project. */
export function findDoctorProjectConversation(
  conversations: ConversationListItem[],
  projectName: string,
  memberUserIds: number[],
  doctorUserId: number,
): ConversationListItem | null {
  const normalizedName = projectName.trim().toLowerCase();
  if (!normalizedName || doctorUserId <= 0) return null;

  const nameToken = normalizedName.split(/\s+/).find((part) => part.length > 3) ?? normalizedName;

  const scoreConversation = (conversation: ConversationListItem): number => {
    const title = (conversation.title ?? "").toLowerCase();
    const userIds = new Set(conversation.users.map((user) => user.id));
    if (!userIds.has(doctorUserId)) return -1;

    let score = 0;
    if (title.includes(normalizedName)) score += 40;
    else if (title.includes(nameToken)) score += 20;

    if (title.includes("supervision")) score += 10;
    if (conversation.participantCount > 2) score += 15;

    const coveredMembers = memberUserIds.filter((id) => userIds.has(id)).length;
    score += coveredMembers * 5;

    if (conversation.lastMessage && !conversation.lastMessage.deleted) score += 3;

    return score;
  };

  const ranked = conversations
    .map((conversation) => ({ conversation, score: scoreConversation(conversation) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.conversation ?? null;
}
