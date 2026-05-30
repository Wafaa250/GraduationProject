import { Loader2, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDoctorHubRelativeTime, initialsFromName } from "@/lib/doctorHubMappers";
import type { ConversationListItem } from "@/api/conversationsApi";
import { MessagesUserSearchBox } from "@/components/messaging/MessagesUserSearchBox";
import {
  getDoctorConversationDisplayName,
  getDoctorConversationKind,
  getDoctorConversationPreview,
  type DoctorConversationKind,
} from "@/lib/doctorMessagesNavigation";
import { DoctorMessagesEmptyState } from "./DoctorMessagesEmptyState";

export type DoctorMessagesFilter = "all" | DoctorConversationKind;

const FILTERS: { id: DoctorMessagesFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "team", label: "Teams" },
  { id: "student", label: "Students" },
];

const TYPE_LABEL: Record<DoctorConversationKind, string> = {
  team: "Team",
  student: "Student",
};

type DoctorMessagesConversationListProps = {
  loading: boolean;
  conversations: ConversationListItem[];
  selectedId: number | null;
  currentUserId: number | null;
  query: string;
  filter: DoctorMessagesFilter;
  onQueryChange: (value: string) => void;
  onFilterChange: (filter: DoctorMessagesFilter) => void;
  onSelect: (id: number) => void;
  onConversationsRefresh: () => Promise<void>;
};

export function DoctorMessagesConversationList({
  loading,
  conversations,
  selectedId,
  currentUserId,
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onSelect,
  onConversationsRefresh,
}: DoctorMessagesConversationListProps) {
  const q = query.trim().toLowerCase();
  const filtered = conversations.filter((c) => {
    const kind = getDoctorConversationKind(c);
    if (filter !== "all" && kind !== filter) return false;
    if (!q) return true;
    const name = getDoctorConversationDisplayName(c, currentUserId).toLowerCase();
    const preview = getDoctorConversationPreview(c).toLowerCase();
    return name.includes(q) || preview.includes(q);
  });

  return (
    <aside className="doctor-messages-sidebar">
      <div className="doctor-messages-sidebar__head">
        <p className="doctor-messages-sidebar__label">Inbox</p>
        <MessagesUserSearchBox
          variant="doctor"
          query={query}
          onQueryChange={onQueryChange}
          conversations={conversations}
          currentUserId={currentUserId}
          onConversationOpen={onSelect}
          onConversationsRefresh={onConversationsRefresh}
        />
        <div className="doctor-messages-segment" role="tablist" aria-label="Filter conversations">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={cn(
                "doctor-messages-segment__btn",
                filter === item.id && "doctor-messages-segment__btn--active",
              )}
              onClick={() => onFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="doctor-messages-sidebar__list">
        {loading ? (
          <div className="doctor-messages-loading">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading conversations" />
          </div>
        ) : filtered.length === 0 ? (
          <DoctorMessagesEmptyState
            title={conversations.length === 0 ? "No conversations yet." : "No matching conversations."}
            description={
              conversations.length === 0
                ? "Messages with supervised students and course teams will appear here."
                : "Try another search term or filter."
            }
          />
        ) : (
          <ul className="space-y-0.5" role="list">
            {filtered.map((conversation) => {
              const kind = getDoctorConversationKind(conversation);
              const displayName = getDoctorConversationDisplayName(conversation, currentUserId);
              const lastAt = conversation.lastMessage?.createdAt;
              const isSelected = selectedId === conversation.id;
              const hasUnread = conversation.unseenCount > 0;

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      "doctor-messages-convo",
                      isSelected && "doctor-messages-convo--selected",
                      hasUnread && "doctor-messages-convo--unread",
                    )}
                  >
                    <span
                      className={cn(
                        "doctor-messages-avatar",
                        kind === "team"
                          ? "doctor-messages-avatar--team"
                          : "doctor-messages-avatar--student",
                      )}
                      aria-hidden
                    >
                      {kind === "team" ? (
                        <Users2 className="h-4 w-4" />
                      ) : (
                        initialsFromName(displayName) || "?"
                      )}
                    </span>
                    <span className="doctor-messages-convo__body">
                      <span className="doctor-messages-convo__top">
                        <span className="doctor-messages-convo__name">{displayName}</span>
                        {lastAt ? (
                          <span className="doctor-messages-convo__time">
                            {formatDoctorHubRelativeTime(lastAt)}
                          </span>
                        ) : null}
                      </span>
                      <span className="doctor-messages-convo__meta">
                        <span
                          className={cn(
                            "doctor-messages-convo__type",
                            kind === "student" && "doctor-messages-convo__type--student",
                          )}
                        >
                          {TYPE_LABEL[kind]}
                        </span>
                        {hasUnread ? (
                          <span className="doctor-messages-unread-badge">
                            {conversation.unseenCount > 99 ? "99+" : conversation.unseenCount}
                          </span>
                        ) : null}
                      </span>
                      <span className="doctor-messages-convo__preview">
                        {getDoctorConversationPreview(conversation)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
