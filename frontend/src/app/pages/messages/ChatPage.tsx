import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../../api/client";
import { getNotificationsHubUrl } from "../../../utils/notificationsHubUrl";
import { markChatScopeRead } from "../../../api/notificationsApi";
import { useUser } from "../../../context/UserContext";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import { cn } from "../../components/ui/utils";

type Message = {
  id: number;
  senderId: number;
  text: string;
  createdAt: Date;
  edited?: boolean;
  deleted?: boolean;
  seen?: boolean;
};

type Conversation = {
  id: number;
  users: number[];
  participantNames: Record<number, string>;
  title?: string;
  courseTeamId?: number | null;
  messages: Message[];
  /** Display name from API when available (list/detail). */
  otherUserName?: string;
};

type ApiConversationUser = { id: number; name?: string; email?: string };

type ApiConversationListItem = {
  id: number;
  title?: string | null;
  courseTeamId?: number | null;
  users?: ApiConversationUser[];
  otherUser?: { id: number; name?: string };
  lastMessage?: ApiMessage | null;
};

type ApiConversationDetails = {
  id: number;
  title?: string | null;
  courseTeamId?: number | null;
  users: { id: number; name?: string }[];
  messages: ApiMessage[];
};

type ApiMessage = {
  id: number;
  senderId: number;
  text: string;
  createdAt: string | Date;
  edited?: boolean;
  deleted?: boolean;
  seen?: boolean;
};

const mapApiMessage = (m: ApiMessage): Message => ({
  id: m.id,
  senderId: m.senderId,
  text: m.text,
  createdAt: new Date(m.createdAt),
  edited: Boolean(m.edited),
  deleted: Boolean(m.deleted),
  seen: Boolean(m.seen),
});

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function formatMessageTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUser();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const globalSearchWrapRef = useRef<HTMLDivElement>(null);
  const [listSearch, setListSearch] = useState("");
  const targetUserId = Number(searchParams.get("userId") ?? 0);
  const requestedConversationId = Number(
    (location.state as { conversationId?: number } | null)?.conversationId ?? 0,
  );
  const currentUserId = Number(localStorage.getItem("userId") ?? 1);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [hoveredConversationId, setHoveredConversationId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hubRef = useRef<signalR.HubConnection | null>(null);
  const selectedConversationIdRef = useRef<number | null>(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getNotificationsHubUrl(), {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    hubRef.current = connection;

    const getConversationIdFromHubPayload = (payload: unknown): number | null => {
      if (!payload || typeof payload !== "object") return null;
      const cid = (payload as { conversationId?: unknown }).conversationId;
      return typeof cid === "number" && Number.isFinite(cid) ? cid : null;
    };

    connection.on("ReceiveMessage", (payload: unknown) => {
      try {
        const convId = getConversationIdFromHubPayload(payload) ?? selectedConversationIdRef.current;
        if (convId == null) return;
        const msg = mapApiMessage(payload as ApiMessage);

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            if (c.messages.some((m) => m.id === msg.id)) return c;
            return {
              ...c,
              messages: [...c.messages, msg].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
            };
          }),
        );
      } catch (err) {
        console.error("SignalR ReceiveMessage", err);
      }
    });

    connection.on("MessageEdited", (payload: unknown) => {
      try {
        const convId = getConversationIdFromHubPayload(payload) ?? selectedConversationIdRef.current;
        if (convId == null) return;
        const raw = payload && typeof payload === "object" && "payload" in payload ? (payload as { payload: unknown }).payload : payload;
        const msg = mapApiMessage(raw as ApiMessage);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            const next = c.messages.map((m) => (m.id === msg.id ? msg : m));
            return { ...c, messages: next.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) };
          }),
        );
      } catch (err) {
        console.error("SignalR MessageEdited", err);
      }
    });

    connection.on("MessageDeleted", (payload: unknown) => {
      try {
        const convId = getConversationIdFromHubPayload(payload) ?? selectedConversationIdRef.current;
        if (convId == null) return;
        const actualPayload = payload && typeof payload === "object" && "payload" in payload
          ? (payload as { payload: unknown }).payload
          : payload;
        if (!actualPayload || typeof actualPayload !== "object" || !("id" in actualPayload)) return;
        const rawId = (actualPayload as { id: unknown }).id;
        const messageId = typeof rawId === "number" ? rawId : Number(rawId);
        if (!Number.isFinite(messageId)) return;

        if ("createdAt" in (actualPayload as object)) {
          const msg = mapApiMessage(actualPayload as ApiMessage);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              const next = c.messages.map((m) => (m.id === msg.id ? msg : m));
              return { ...c, messages: next.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) };
            }),
          );
          return;
        }

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id !== messageId) return m;
                const p = actualPayload as { text?: unknown; deleted?: unknown; edited?: unknown; seen?: unknown };
                return {
                  ...m,
                  deleted: typeof p.deleted === "boolean" ? p.deleted : true,
                  text: typeof p.text === "string" ? p.text : "Message removed",
                  edited: typeof p.edited === "boolean" ? p.edited : false,
                  seen: typeof p.seen === "boolean" ? p.seen : m.seen,
                };
              }),
            };
          }),
        );
      } catch (err) {
        console.error("SignalR MessageDeleted", err);
      }
    });

    connection
      .start()
      .then(() => undefined)
      .catch((err) => {
        console.error("SignalR connection start", err);
      });

    return () => {
      connection.off("ReceiveMessage");
      connection.off("MessageEdited");
      connection.off("MessageDeleted");
      hubRef.current = null;
      connection.stop().catch((err) => {
        console.error("SignalR connection stop", err);
      });
    };
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await apiClient.get<ApiConversationListItem[]>("/conversations");
      const mapped = data.map((c) => {
        const apiUsers = Array.isArray(c.users) ? c.users : [];
        const users = apiUsers.length > 0
          ? apiUsers.map((u) => u.id)
          : [currentUserId, c.otherUser?.id ?? 0].filter((id) => id > 0);
        const participantNames = Object.fromEntries(
          apiUsers
            .filter((u) => typeof u.id === "number" && Number.isFinite(u.id))
            .map((u) => [u.id, (u.name ?? "").trim()]),
        );
        return {
          id: c.id,
          title: c.title ?? undefined,
          courseTeamId: c.courseTeamId ?? null,
          users,
          participantNames,
          messages: c.lastMessage ? [mapApiMessage(c.lastMessage)] : [],
          otherUserName: c.otherUser?.name,
        } as Conversation;
      });

      // Defensive dedupe for direct conversations only (2 members).
      // Group conversations (team chat) must stay distinct by conversation id.
      const dedupedByOtherUser = new Map<number, Conversation>();
      const groupConversations: Conversation[] = [];
      for (const conv of mapped) {
        if (conv.users.length != 2) {
          groupConversations.push(conv);
          continue;
        }
        const otherUserId = conv.users.find((u) => u !== currentUserId) ?? 0;
        const existing = dedupedByOtherUser.get(otherUserId);
        if (!existing) {
          dedupedByOtherUser.set(otherUserId, conv);
          continue;
        }
        const existingTime = existing.messages[0]?.createdAt?.getTime() ?? 0;
        const nextTime = conv.messages[0]?.createdAt?.getTime() ?? 0;
        if (nextTime >= existingTime) {
          dedupedByOtherUser.set(otherUserId, conv);
        }
      }

      setConversations(
        [...dedupedByOtherUser.values(), ...groupConversations].sort(
          (a, b) =>
            (b.messages[b.messages.length - 1]?.createdAt?.getTime() ?? 0) -
            (a.messages[a.messages.length - 1]?.createdAt?.getTime() ?? 0),
        ),
      );
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  }, [currentUserId]);

  const loadConversationById = useCallback(
    async (conversationId: number) => {
      try {
        const { data } = await apiClient.get<ApiConversationDetails>(`/conversations/${conversationId}`);
        const other = data.users.find((u) => u.id !== currentUserId);
        const nameFromDetail = other?.name?.trim();
        const mapped: Conversation = {
          id: data.id,
          title: data.title ?? undefined,
          courseTeamId: data.courseTeamId ?? null,
          users: data.users.map((u) => u.id),
          participantNames: Object.fromEntries(
            data.users.map((u) => [u.id, (u.name ?? "").trim()]),
          ),
          messages: [...data.messages].map(mapApiMessage).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
          otherUserName: nameFromDetail,
        };

        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === mapped.id);
          if (idx === -1) return [mapped, ...prev];
          const next = [...prev];
          const prevName = next[idx].otherUserName;
          next[idx] = {
            ...mapped,
            otherUserName: mapped.otherUserName || prevName,
          };
          return next;
        });

        setSelectedConversationId(mapped.id);
        return mapped.id;
      } catch (err) {
        console.error("Failed to load conversation details", err);
        return null;
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!targetUserId || !Number.isFinite(targetUserId) || targetUserId <= 0) return;

    (async () => {
      try {
        const { data } = await apiClient.post<{ conversationId?: number; id?: number }>(
          `/conversations/start/${targetUserId}`,
        );
        const conversationId = data.conversationId ?? data.id;
        if (!conversationId) return;
        await loadConversationById(conversationId);
        await loadConversations();
      } catch (err) {
        console.error("Failed to start conversation", err);
      }
    })();
  }, [targetUserId, loadConversationById, loadConversations]);

  useEffect(() => {
    if (!requestedConversationId || !Number.isFinite(requestedConversationId) || requestedConversationId <= 0) return;

    (async () => {
      await loadConversationById(requestedConversationId);
      await loadConversations();
    })();
  }, [requestedConversationId, loadConversationById, loadConversations]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    if (!selectedConversationId) return;

    // Mark other user's messages as seen on open/select.
    apiClient.post(`/messages/${selectedConversationId}/seen`).catch((err) => {
      console.error("Failed to mark conversation as seen", err);
    });
    markChatScopeRead(`direct:${selectedConversationId}`).catch(() => undefined);

    setConversations((prev) =>
      prev.map((c) =>
        c.id !== selectedConversationId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) => (m.senderId !== currentUserId ? { ...m, seen: true } : m)),
            },
      ),
    );
  }, [selectedConversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedConversation?.messages.length, selectedConversationId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !selectedConversationId) return;

    try {
      await apiClient.post<ApiMessage>("/messages", {
        conversationId: selectedConversationId,
        text,
      });
      await loadConversationById(selectedConversationId);
      setInput("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const startEditMessage = (message: Message) => {
    if (message.senderId !== currentUserId || message.deleted) return;
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const saveEditMessage = async () => {
    const text = editingText.trim();
    if (!selectedConversationId || !editingMessageId || !text) return;

    try {
      await apiClient.put<ApiMessage>(`/messages/${editingMessageId}`, { text });
      await loadConversationById(selectedConversationId);
      setEditingMessageId(null);
      setEditingText("");
    } catch (err) {
      console.error("Failed to edit message", err);
    }
  };

  const unsendMessage = async (messageId: number) => {
    if (!selectedConversationId) return;

    try {
      await apiClient.delete<ApiMessage>(`/messages/${messageId}`);
      await loadConversationById(selectedConversationId);

      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setEditingText("");
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await apiClient.delete(`/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
        setEditingMessageId(null);
        setEditingText("");
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const confirmDeleteConversation = (id: number, displayName?: string) => {
    const label = displayName?.trim();
    const message = label
      ? `Delete conversation with ${label}? This cannot be undone.`
      : "Delete this conversation? This cannot be undone.";
    if (!window.confirm(message)) return;
    void handleDeleteConversation(id);
  };

  const handleSelectConversation = async (id: number) => {
    await loadConversationById(id);
  };

  const getOtherUserId = (conversation: Conversation) =>
    conversation.users.find((u) => u !== currentUserId) ?? conversation.users[0] ?? 0;

  const isGroupConversation = (conversation: Conversation) => conversation.users.length > 2 || !!conversation.courseTeamId;

  const getOtherUserDisplayName = (conversation: Conversation) => {
    if (isGroupConversation(conversation)) {
      const t = conversation.title?.trim();
      if (t) return t;
      return `Group (${conversation.users.length})`;
    }
    const n = conversation.otherUserName?.trim();
    if (n) return n;
    return `User ${getOtherUserId(conversation)}`;
  };

  const getSenderName = (conversation: Conversation, senderId: number) => {
    const byMap = conversation.participantNames[senderId]?.trim();
    if (byMap) return byMap;
    if (senderId === currentUserId) return "You";
    return `User ${senderId}`;
  };

  const getConversationContext = (conversation: Conversation) => {
    const title = conversation.title?.trim();
    if (title) return title;
    if (isGroupConversation(conversation)) return "Team chat";
    return "Direct message";
  };

  const hasUnread = (conversation: Conversation) => {
    const last = conversation.messages[conversation.messages.length - 1];
    return !!last && last.senderId !== currentUserId && !last.seen;
  };

  const filteredConversations = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = getOtherUserDisplayName(c).toLowerCase();
      const ctx = getConversationContext(c).toLowerCase();
      const last = c.messages[c.messages.length - 1];
      const preview = last?.deleted ? "message removed" : (last?.text ?? "").toLowerCase();
      return name.includes(q) || ctx.includes(q) || preview.includes(q);
    });
  }, [conversations, listSearch, currentUserId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const shellProps = {
    userName: profile.fullName,
    profilePic: profile.profilePic,
    searchQuery,
    onSearchChange: setSearchQuery,
    searchWrapRef: globalSearchWrapRef,
    globalSearchResults: null as const,
    globalSearchLoading: false,
    onSelectStudent: (id: number) => navigate(`/students/${id}`),
    onSelectDoctor: (id: number) => navigate(`/doctors/${id}`),
    onOpenSettings: () => navigate("/edit-profile"),
    onLogout: handleLogout,
  };

  const showListOnMobile = !selectedConversation;
  const showChatOnMobile = !!selectedConversation;

  return (
    <StudentDashboardShell {...shellProps}>
      <div className="flex h-[calc(100vh-8rem)] min-h-[480px] overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {/* Conversation list */}
        <aside
          className={cn(
            "flex w-full flex-col border-border sm:w-80 sm:border-r",
            showListOnMobile ? "flex" : "hidden sm:flex",
          )}
        >
          <div className="border-b border-border p-4">
            <h2 className="mb-3 font-display text-lg font-bold">Messages</h2>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="h-6 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                placeholder="Search…"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {conversations.length === 0
                  ? "Start a conversation from a profile or teammate card."
                  : "No conversations match your search."}
              </p>
            ) : (
              filteredConversations.map((c) => {
                const displayName = getOtherUserDisplayName(c);
                const last = c.messages[c.messages.length - 1];
                const preview =
                  last == null
                    ? "No messages yet"
                    : last.deleted
                      ? "Message removed"
                      : last.text;
                const unread = hasUnread(c);
                const isActive = c.id === selectedConversationId;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void handleSelectConversation(c.id)}
                    onMouseEnter={() => setHoveredConversationId(c.id)}
                    onMouseLeave={() => setHoveredConversationId(null)}
                    className={cn(
                      "group relative flex w-full gap-3 border-b border-border p-3 text-left transition-colors hover:bg-muted/40",
                      isActive && "bg-primary/5",
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                        {initialsFromName(displayName)}
                      </div>
                      {unread ? (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gradient-ai ring-2 ring-card" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {last ? formatRelativeTime(last.createdAt) : ""}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{preview}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteConversation(c.id, displayName);
                      }}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100",
                        hoveredConversationId === c.id && "opacity-100",
                      )}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            showChatOnMobile ? "flex" : "hidden sm:flex",
          )}
        >
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <p className="font-display font-semibold text-foreground">
                Select a conversation
              </p>
              <p className="text-sm">Choose a chat from the list to continue.</p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between border-b border-border p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 sm:hidden"
                    onClick={() => setSelectedConversationId(null)}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {initialsFromName(getOtherUserDisplayName(selectedConversation))}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold leading-tight">
                      {isGroupConversation(selectedConversation) ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          {getOtherUserDisplayName(selectedConversation)}
                        </span>
                      ) : (
                        getOtherUserDisplayName(selectedConversation)
                      )}
                    </p>
                    <p className="inline-flex items-center gap-1 text-xs text-ai">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {getConversationContext(selectedConversation)}
                      </span>
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      aria-label="Conversation options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {!isGroupConversation(selectedConversation) ? (
                      <DropdownMenuItem
                        onSelect={() => {
                          const otherId = getOtherUserId(selectedConversation);
                          if (otherId) navigate(`/students/${otherId}`);
                        }}
                      >
                        View profile
                      </DropdownMenuItem>
                    ) : null}
                    {!isGroupConversation(selectedConversation) ? (
                      <DropdownMenuSeparator />
                    ) : null}
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() =>
                        confirmDeleteConversation(
                          selectedConversation.id,
                          getOtherUserDisplayName(selectedConversation),
                        )
                      }
                    >
                      Delete conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>

              {isGroupConversation(selectedConversation) ? (
                <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2">
                  {selectedConversation.users.slice(0, 8).map((uid) => (
                    <span
                      key={uid}
                      className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary"
                    >
                      {getSenderName(selectedConversation, uid)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-gradient-surface p-6">
                {selectedConversation.messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No messages yet. Say hello.
                  </p>
                ) : (
                  selectedConversation.messages.map((m) => {
                    const isMe = m.senderId === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", isMe ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            editingMessageId === m.id
                              ? "border border-border bg-background text-foreground shadow-soft"
                              : isMe
                                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                                : "border border-border bg-card text-foreground",
                          )}
                          onDoubleClick={() => startEditMessage(m)}
                        >
                          {editingMessageId === m.id ? (
                            <div className="flex min-w-[200px] flex-col gap-2">
                              <Input
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void saveEditMessage();
                                  if (e.key === "Escape") {
                                    setEditingMessageId(null);
                                    setEditingText("");
                                  }
                                }}
                                className="h-9 border-border bg-card text-foreground caret-primary placeholder:text-muted-foreground"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="gradient"
                                className="w-full"
                                onClick={() => void saveEditMessage()}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <>
                              {isGroupConversation(selectedConversation) && !isMe ? (
                                <p className="mb-1 text-[10px] font-bold text-primary">
                                  {getSenderName(selectedConversation, m.senderId)}
                                </p>
                              ) : null}
                              <p className="leading-relaxed">
                                {m.deleted ? "Message removed" : m.text}
                              </p>
                              <div
                                className={cn(
                                  "mt-1 flex flex-wrap items-center gap-2 text-[10px]",
                                  isMe
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground",
                                )}
                              >
                                <span>{formatMessageTime(m.createdAt)}</span>
                                {m.edited && !m.deleted ? <span>(edited)</span> : null}
                                {isMe ? (
                                  <>
                                    <span>{m.seen ? "✔✔" : "✔"}</span>
                                    {!m.deleted ? (
                                      <>
                                        <button
                                          type="button"
                                          className="opacity-80 hover:opacity-100"
                                          onClick={() => startEditMessage(m)}
                                          aria-label="Edit message"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          className="opacity-80 hover:opacity-100"
                                          onClick={() => void unsendMessage(m.id)}
                                          aria-label="Delete message"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </>
                                    ) : null}
                                  </>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-center gap-2 border-t border-border p-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Write a message…"
                  className="flex-1"
                  disabled={!selectedConversation}
                />
                <Button
                  type="button"
                  variant="gradient"
                  size="icon"
                  className="shrink-0 shadow-glow"
                  onClick={() => void sendMessage()}
                  disabled={!selectedConversation || !input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </StudentDashboardShell>
  );
}
