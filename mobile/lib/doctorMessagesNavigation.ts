import type { ConversationDetails, ConversationListItem } from "@/api/conversationsApi";

export type DoctorConversationKind = "team" | "student";

export type DoctorMessagesFilter = "all" | DoctorConversationKind;

export function getDoctorConversationKind(
  conversation: Pick<ConversationListItem, "courseTeamId" | "participantCount" | "type">,
): DoctorConversationKind {
  if (
    conversation.type === "Team" ||
    conversation.courseTeamId != null ||
    conversation.participantCount > 2
  ) {
    return "team";
  }
  return "student";
}

export function getDoctorConversationDisplayName(
  conversation: ConversationListItem | ConversationDetails,
  currentUserId?: number | null,
): string {
  const title = conversation.title?.trim();
  if (title) return title;
  if (getDoctorConversationKind(conversation) === "student") {
    if ("otherUser" in conversation && conversation.otherUser?.name?.trim()) {
      return conversation.otherUser.name.trim();
    }
    const other = conversation.users.find((u) => u.id !== currentUserId);
    return other?.name?.trim() || "Student";
  }
  return "Team conversation";
}

export function getDoctorConversationRoleLabel(
  conversation: Pick<ConversationListItem, "courseTeamId" | "participantCount" | "type">,
): string {
  return getDoctorConversationKind(conversation) === "team" ? "Team" : "Student";
}

export function getDoctorConversationPreview(conversation: ConversationListItem): string {
  const last = conversation.lastMessage;
  if (!last || last.deleted) return "No messages yet";
  const text = last.text.trim();
  return text.length > 90 ? `${text.slice(0, 90)}…` : text || "No messages yet";
}

export function getDoctorConversationSubtitle(
  conversation: ConversationListItem,
  currentUserId?: number | null,
): string {
  const kind = getDoctorConversationKind(conversation);
  if (kind === "team") {
    return `${conversation.participantCount} participants · Team chat`;
  }
  const other = conversation.otherUser ?? conversation.users.find((u) => u.id !== currentUserId);
  return other?.email?.trim() || "Direct message";
}

export function getDoctorStudentProfilePath(
  conversation: ConversationDetails | ConversationListItem,
  currentUserId?: number | null,
): string | null {
  if (getDoctorConversationKind(conversation) !== "student") return null;
  if ("otherUser" in conversation && conversation.otherUser?.id) {
    return `/students/${conversation.otherUser.id}`;
  }
  const other = conversation.users.find((u) => u.id !== currentUserId);
  return other?.id ? `/students/${other.id}` : null;
}

export function formatDoctorMessageTime(iso?: string | null): string {
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

/** Bubble timestamp — matches web DoctorMessagesThread formatMessageTime. */
export function formatDoctorMessageBubbleTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function getMessageTextStyle(text: string) {
  return {
    writingDirection: "auto" as const,
  };
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;

export function isAnnouncementMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.startsWith("reminder:") ||
    normalized.startsWith("announcement:") ||
    normalized.includes("supervision meeting has been moved")
  );
}

export function extractLinkAttachment(text: string): { body: string; url: string } | null {
  const match = text.match(URL_PATTERN);
  if (!match?.[0]) return null;
  const url = match[0].replace(/[),.]+$/, "");
  const body = text.replace(url, "").trim();
  return { body: body || url, url };
}
