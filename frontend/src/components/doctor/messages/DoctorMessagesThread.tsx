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
  resolvingTeamLink: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onViewTeam: () => void;
  onViewStudent: () => void;
};

export function DoctorMessagesThread({
  loading,
  thread,
  currentUserId,
  draft,
  sending,
  resolvingTeamLink,
  onDraftChange,
  onSend,
  onViewTeam,
  onViewStudent,
}: DoctorMessagesThreadProps) {
  const senderNames = useMemo(() => {
    const map = new Map<number, string>();
    thread?.users.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [thread?.users]);

  if (loading) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card md:col-span-7">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading conversation" />
        </div>
      </section>
    );
  }

  if (!thread) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card md:col-span-7">
        <div className="flex flex-1 items-center justify-center">
          <DoctorMessagesEmptyState
            title="Select a conversation."
            description="Choose a student or team conversation to read and reply."
          />
        </div>
      </section>
    );
  }

  const kind = getDoctorConversationKind(thread);
  const displayName = getDoctorConversationDisplayName(thread, currentUserId);
  const studentPath = getDoctorStudentProfilePath(thread, currentUserId);
  const showViewTeam = kind === "team" && thread.courseTeamId != null;
  const showViewStudent = kind === "student" && studentPath != null;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card md:col-span-7">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {thread.participantCount} participant{thread.participantCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {showViewTeam ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-primary/30 text-xs text-primary hover:bg-accent hover:text-primary"
                disabled={resolvingTeamLink}
                onClick={onViewTeam}
              >
                {resolvingTeamLink ? "Opening…" : "View Team"}
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Button>
            ) : null}
            {showViewStudent ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-primary/30 text-xs text-primary hover:bg-accent hover:text-primary"
                onClick={onViewStudent}
              >
                View Student
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {thread.messages.length === 0 ? (
          <DoctorMessagesEmptyState
            title="No messages yet."
            description="Send the first message to begin the academic conversation."
          />
        ) : (
          <div className="space-y-4">
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
      <p className="text-center text-xs italic text-muted-foreground">Message removed</p>
    );
  }

  const text = message.text.trim();
  const announcement = isAnnouncementMessage(text);
  const linkAttachment = !announcement ? extractLinkAttachment(text) : null;
  const bodyText = linkAttachment?.body ?? text;
  const time = formatMessageTime(message.createdAt);

  if (announcement) {
    return (
      <div
        className="rounded-lg border px-5 py-4"
        style={{
          backgroundColor: "hsl(var(--announcement))",
          borderColor: "hsl(var(--announcement-border))",
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Announcement
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs font-medium text-foreground">{senderName}</span>
          <span className="text-xs text-muted-foreground">· {time}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-5 py-4",
        isFaculty ? "border-primary/15" : "border-border bg-card",
      )}
      style={isFaculty ? { backgroundColor: "hsl(var(--faculty-bubble))" } : undefined}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{senderName}</span>
        {isFaculty ? (
          <span className="text-[11px] text-muted-foreground">· Supervisor</span>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">{time}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{bodyText}</p>
      {linkAttachment ? (
        <a
          href={linkAttachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 transition-smooth hover:border-primary/30"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
            <FileText className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 text-left">
            <div className="truncate text-xs font-medium text-foreground">Shared link</div>
            <div className="max-w-[14rem] truncate text-[11px] text-muted-foreground">
              {linkAttachment.url}
            </div>
          </div>
          <span className="text-xs font-medium text-primary">Open</span>
        </a>
      ) : null}
      {message.edited ? (
        <p className="mt-1 text-[10px] text-muted-foreground">Edited</p>
      ) : null}
    </div>
  );
}
