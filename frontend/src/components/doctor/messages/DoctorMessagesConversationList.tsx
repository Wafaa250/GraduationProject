import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDoctorHubRelativeTime } from "@/lib/doctorHubMappers";
import type { ConversationListItem } from "@/api/conversationsApi";
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
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card md:col-span-3">
      <div className="border-b border-border p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Conversations</h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search conversations"
            className="h-9 border-border bg-secondary/60 pl-9"
            aria-label="Search conversations"
          />
        </div>
        <div className="mt-3 flex gap-1 rounded-lg bg-secondary/50 p-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-smooth",
                filter === item.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading conversations" />
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
          <ul className="space-y-1">
            {filtered.map((conversation) => {
              const kind = getDoctorConversationKind(conversation);
              const lastAt = conversation.lastMessage?.createdAt;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left transition-smooth",
                      "hover:bg-accent/60",
                      selectedId === conversation.id && "border border-primary/20 bg-accent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {getDoctorConversationDisplayName(conversation, currentUserId)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-4 shrink-0 border-0 bg-secondary px-1.5 text-[10px] font-medium text-secondary-foreground"
                          >
                            {TYPE_LABEL[kind]}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {getDoctorConversationPreview(conversation)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {lastAt ? (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDoctorHubRelativeTime(lastAt)}
                          </span>
                        ) : null}
                        {conversation.unseenCount > 0 ? (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                            {conversation.unseenCount > 99 ? "99+" : conversation.unseenCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
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
