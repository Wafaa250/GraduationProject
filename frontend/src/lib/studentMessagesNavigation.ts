import type { ConversationDetails, ConversationListItem } from "@/api/conversationsApi";

export function getStudentConversationDisplayName(
  conversation: ConversationListItem | ConversationDetails,
  currentUserId: number | null,
): string {
  if (conversation.title?.trim()) return conversation.title.trim();
  if ("otherUser" in conversation && conversation.otherUser?.name) {
    return conversation.otherUser.name;
  }
  const other = conversation.users.find((u) => u.id !== currentUserId);
  return other?.name ?? "Conversation";
}

export function getStudentConversationSubtitle(
  conversation: ConversationListItem,
  currentUserId: number | null,
): string {
  if (conversation.courseTeamId != null) return "Project team";
  const other = conversation.otherUser ?? conversation.users.find((u) => u.id !== currentUserId);
  if (other?.email) return other.email;
  return `${conversation.participantCount} participants`;
}

export function getStudentConversationPreview(conversation: ConversationListItem): string {
  const text = conversation.lastMessage?.text?.trim();
  if (!text) return "No messages yet";
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

export function formatStudentMessageTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) {
      return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return date.toLocaleDateString(undefined, { weekday: "short" });
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
