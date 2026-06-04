import { Loader2, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/api/conversationsApi";
import {
  formatStudentMessageTime,
  getStudentConversationDisplayName,
  getStudentConversationPreview,
  getStudentConversationSubtitle,
} from "@/lib/studentMessagesNavigation";
import { ConversationDeleteButton } from "@/components/messaging/ConversationDeleteButton";
import { StudentMessagesEmptyState } from "./StudentMessagesEmptyState";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type StudentMessagesConversationListProps = {
  loading: boolean;
  conversations: ConversationListItem[];
  selectedId: number | null;
  currentUserId: number | null;
  onSelect: (id: number) => void;
  onRequestDelete?: (id: number) => void;
};

export function StudentMessagesConversationList({
  loading,
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  onRequestDelete,
}: StudentMessagesConversationListProps) {
  return (
    <aside className="student-messages-sidebar">
      <div className="student-messages-sidebar__head">
        <h2 className="font-display text-lg font-semibold">Conversations</h2>
      </div>

      <div className="student-messages-sidebar__list">
        {loading ? (
          <div className="student-messages-loading">
            <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading conversations" />
          </div>
        ) : conversations.length === 0 ? (
          <StudentMessagesEmptyState
            title="No conversations yet"
            description="When you message a supervisor or team, it will appear here."
          />
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => {
              const name = getStudentConversationDisplayName(c, currentUserId);
              const active = selectedId === c.id;
              const unread = c.unseenCount ?? 0;
              const isTeam = c.courseTeamId != null || c.type === "Team";
              return (
                <li key={c.id} className="student-messages-conv-wrap">
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "student-messages-conv",
                      active && "student-messages-conv--active",
                      onRequestDelete && "student-messages-conv--deletable",
                    )}
                  >
                    <div
                      className={cn(
                        "student-messages-avatar",
                        isTeam && "student-messages-avatar--team",
                      )}
                      aria-hidden
                    >
                      {isTeam ? <Users2 className="h-4 w-4" /> : initials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            unread > 0 ? "font-semibold" : "font-medium",
                          )}
                        >
                          {name}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatStudentMessageTime(c.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {getStudentConversationSubtitle(c, currentUserId)}
                      </p>
                      <p
                        className={cn(
                          "mt-1 truncate text-xs",
                          unread > 0
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {getStudentConversationPreview(c)}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="mt-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>
                  {onRequestDelete ? (
                    <ConversationDeleteButton
                      className="student-messages-conv-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete(c.id);
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
