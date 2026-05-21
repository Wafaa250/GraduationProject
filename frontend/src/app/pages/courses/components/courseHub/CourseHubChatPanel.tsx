import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { cn } from "../../../../components/ui/utils";
import { CourseHubEmptyState } from "./CourseHubEmptyState";

export type CourseHubChatMessage = {
  id: number;
  senderUserId: number;
  senderName: string;
  text: string;
  sentAt: string;
};

/** Standalone section/team chat panel height — keep in sync with `CourseHubTeamWorkspacePanel`. */
export const COURSE_HUB_CHAT_PANEL_HEIGHT = "h-[600px]";

/** Section / team chat — layout matches Lovable ChatPanel (CourseDetailPage). */
export function CourseHubChatPanel({
  meUserId,
  messages,
  onSend,
  loading,
  sending,
  placeholder = "Write a message…",
  emptyTitle = "No messages yet",
  emptyDescription = "Be the first to say hi.",
  embedded = false,
  className,
}: {
  meUserId: number | null;
  messages: CourseHubChatMessage[];
  onSend: (text: string) => Promise<void>;
  loading?: boolean;
  sending?: boolean;
  placeholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Inside a parent card — no outer border/shadow. */
  embedded?: boolean;
  className?: string;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    try {
      await onSend(t);
      setText("");
    } catch {
      /* parent handles errors */
    }
  };

  const isMine = (senderUserId: number) =>
    meUserId != null && Number(senderUserId) === Number(meUserId);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        embedded
          ? "h-full bg-transparent"
          : cn(
              COURSE_HUB_CHAT_PANEL_HEIGHT,
              "rounded-2xl border border-border bg-card shadow-card",
            ),
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center">
            <CourseHubEmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const mine = isMine(m.senderUserId);
              return (
                <div
                  key={m.id}
                  className={cn("flex items-end gap-2", mine && "flex-row-reverse")}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-medium",
                        mine
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {(m.senderName || "M")
                        .split(/\s+/)
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[75%] space-y-1", mine && "text-right")}>
                    <div
                      className={cn(
                        "flex items-center gap-2 text-xs text-muted-foreground",
                        mine && "justify-end",
                      )}
                    >
                      <span className="font-medium text-muted-foreground">
                        {mine ? "You" : m.senderName}
                      </span>
                      <span>
                        {new Date(m.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "inline-block whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                        mine
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => void submit(e)}
        className="flex items-center gap-2 border-t border-border bg-background/60 px-3 py-3 sm:px-4"
      >
        <div className="relative min-w-0 flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            disabled={sending}
            className="h-10 w-full rounded-full border-border bg-muted/40 pr-11 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !text.trim()}
            className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
