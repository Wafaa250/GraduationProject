import { useEffect, useRef } from "react";
import { Loader2, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationDetails } from "@/api/conversationsApi";
import {
  formatStudentMessageTime,
  getStudentConversationDisplayName,
  getStudentMessageSenderName,
  isStudentGroupConversation,
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

type StudentMessagesThreadProps = {
  loading: boolean;
  thread: ConversationDetails | null;
  selectedId: number | null;
  currentUserId: number | null;
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  focusComposer?: boolean;
  onComposerFocused?: () => void;
  onRequestDelete?: () => void;
};

export function StudentMessagesThread({
  loading,
  thread,
  selectedId,
  currentUserId,
  draft,
  sending,
  onDraftChange,
  onSend,
  focusComposer = false,
  onComposerFocused,
  onRequestDelete,
}: StudentMessagesThreadProps) {
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!focusComposer || loading || !thread) return;
    composerRef.current?.focus();
    onComposerFocused?.();
  }, [focusComposer, loading, thread, selectedId, onComposerFocused]);

  if (selectedId == null) {
    return (
      <section className="student-messages-panel">
        <StudentMessagesEmptyState
          title="Select a conversation"
          description="Choose a thread from the list to read and send messages."
        />
      </section>
    );
  }

  if (loading || !thread) {
    return (
      <section className="student-messages-panel">
        <div className="student-messages-loading">
          <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading conversation" />
        </div>
      </section>
    );
  }

  const title = getStudentConversationDisplayName(thread, currentUserId);
  const other = thread.users.find((u) => u.id !== currentUserId);
  const isTeam = thread.courseTeamId != null || thread.type === "Team";
  const isGroupConversation = isStudentGroupConversation(thread);
  const subtitle =
    isTeam
      ? "Project team"
      : other?.email ?? `${thread.participantCount} participants`;

  return (
    <section className="student-messages-panel">
      <header className="student-messages-panel__head">
        <div
          className={cn(
            "student-messages-avatar",
            isTeam && "student-messages-avatar--team",
          )}
        >
          {isTeam ? <Users2 className="h-4 w-4" /> : initials(title)}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        {onRequestDelete ? (
          <ConversationDeleteButton
            className="student-messages-panel__delete"
            onClick={(e) => {
              e.preventDefault();
              onRequestDelete();
            }}
          />
        ) : null}
      </header>

      <div className="student-messages-feed space-y-4">
        {thread.messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          thread.messages.map((m) => {
            const mine = m.senderId === currentUserId;
            const senderName = isGroupConversation
              ? getStudentMessageSenderName(thread.users, m.senderId, currentUserId)
              : null;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "student-messages-bubble",
                    mine ? "student-messages-bubble--mine" : "student-messages-bubble--theirs",
                  )}
                >
                  {senderName ? (
                    <p className="text-[10px] font-semibold text-primary mb-0.5">{senderName}</p>
                  ) : null}
                  <p>{m.text}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {formatStudentMessageTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer className="student-messages-composer">
        <form
          className="student-messages-composer__inner"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <textarea
            ref={composerRef}
            rows={1}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Write a message…"
            className="student-messages-composer__input"
            aria-label="Message text"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </footer>
    </section>
  );
}
