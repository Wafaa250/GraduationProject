import { useMemo } from "react";
import { ExternalLink, FileText, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConversationDetails, ConversationMessage } from "@/api/conversationsApi";
import {
  getDoctorConversationDisplayName,
  getDoctorConversationKind,
  getDoctorStudentProfilePath,
} from "@/lib/doctorMessagesNavigation";
import { DoctorMessagesEmptyState } from "./DoctorMessagesEmptyState";
import { DoctorMessagesComposer } from "./DoctorMessagesComposer";

const URL_PATTERN = /(https?:\/\/[^\s]+)/gi;

function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function isAnnouncementMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.startsWith("reminder:") ||
    normalized.startsWith("announcement:") ||
    normalized.includes("supervision meeting has been moved")
  );
}

function extractLinkAttachment(text: string): { body: string; url: string } | null {
  const match = text.match(URL_PATTERN);
  if (!match?.[0]) return null;
  const url = match[0].replace(/[),.]+$/, "");
  const body = text.replace(url, "").trim();
  return { body: body || url, url };
}

type DoctorMessagesThreadProps = {
  loading: boolean;
  thread: ConversationDetails | null;
  currentUserId: number | null;
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onViewStudent: () => void;
  /** Non-clickable label in the thread header (replaces action buttons). */
  headerBadge?: string;
  /** Hide header actions (used when context badge is shown on the page header). */
  suppressHeaderActions?: boolean;
};

export function DoctorMessagesThread({
  loading,
  thread,
  currentUserId,
  draft,
  sending,
  onDraftChange,
  onSend,
  onViewStudent,
  headerBadge,
  suppressHeaderActions = false,
}: DoctorMessagesThreadProps) {
  const senderNames = useMemo(() => {
    const map = new Map<number, string>();
    thread?.users.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [thread?.users]);

  if (loading) {
    return (
      <section className="doctor-messages-panel">
        <div className="doctor-messages-loading">
          <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading conversation" />
        </div>
      </section>
    );
  }

  if (!thread) {
    return (
      <section className="doctor-messages-panel">
        <DoctorMessagesEmptyState
          variant="hero"
          title="Select a conversation"
          description="Choose a student or team conversation from your inbox to read messages and reply in real time."
        />
      </section>
    );
  }

  const kind = getDoctorConversationKind(thread);
  const displayName = getDoctorConversationDisplayName(thread, currentUserId);
  const studentPath = getDoctorStudentProfilePath(thread, currentUserId);
  const showViewStudent =
    !suppressHeaderActions && !headerBadge && kind === "student" && studentPath != null;

  return (
    <section className="doctor-messages-panel">
      <header className="doctor-messages-panel__header">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="doctor-messages-panel__title">{displayName}</h3>
            <p className="doctor-messages-panel__meta">
              {thread.participantCount} participant{thread.participantCount === 1 ? "" : "s"}
            </p>
          </div>
          {headerBadge ? (
            <span className="doctor-messages-context-badge shrink-0">{headerBadge}</span>
          ) : showViewStudent ? (
            <div className="doctor-messages-panel__actions flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="doctor-messages-action-btn"
                onClick={onViewStudent}
              >
                View Student
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="doctor-messages-scroll">
        {thread.messages.length === 0 ? (
          <DoctorMessagesEmptyState
            variant="hero"
            title="No messages yet"
            description="Send the first message to begin the academic conversation with your students."
          />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {thread.messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                senderName={senderNames.get(message.senderId) ?? "Participant"}
                isFaculty={currentUserId != null && message.senderId === currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      <DoctorMessagesComposer
        value={draft}
        sending={sending}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </section>
  );
}

function MessageRow({
  message,
  senderName,
  isFaculty,
}: {
  message: ConversationMessage;
  senderName: string;
  isFaculty: boolean;
}) {
  if (message.deleted) {
    return (
      <p className="text-center text-xs italic text-muted-foreground py-2">Message removed</p>
    );
  }

  const text = message.text.trim();
  const announcement = isAnnouncementMessage(text);
  const linkAttachment = !announcement ? extractLinkAttachment(text) : null;
  const bodyText = linkAttachment?.body ?? text;
  const time = formatMessageTime(message.createdAt);

  if (announcement) {
    return (
      <div className="doctor-messages-announcement">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary shrink-0" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Announcement
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
          <span className="text-xs font-semibold text-foreground">{senderName}</span>
          <span className="text-xs text-muted-foreground sm:ml-auto">{time}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "doctor-messages-bubble-row",
        isFaculty ? "doctor-messages-bubble-row--faculty" : "doctor-messages-bubble-row--other",
      )}
    >
      <div
        className={cn(
          "doctor-messages-bubble",
          isFaculty ? "doctor-messages-bubble--faculty" : "doctor-messages-bubble--other",
        )}
      >
        <div className="doctor-messages-bubble__head">
          <span className="doctor-messages-bubble__sender">{senderName}</span>
          {isFaculty ? (
            <span className="doctor-messages-bubble__role">Supervisor</span>
          ) : null}
          <span className="doctor-messages-bubble__time">{time}</span>
        </div>
        <p className="doctor-messages-bubble__text">{bodyText}</p>
        {linkAttachment ? (
          <a
            href={linkAttachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="doctor-messages-link-card"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate text-xs font-semibold text-foreground">Shared link</div>
              <div className="max-w-[14rem] truncate text-[11px] text-muted-foreground">
                {linkAttachment.url}
              </div>
            </div>
            <span className="text-xs font-semibold text-primary shrink-0">Open</span>
          </a>
        ) : null}
        {message.edited ? (
          <p className="mt-1.5 text-[10px] font-medium text-muted-foreground">Edited</p>
        ) : null}
      </div>
    </div>
  );
}
