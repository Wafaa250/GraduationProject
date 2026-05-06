import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as signalR from "@microsoft/signalr";
import { ArrowLeft, Pencil, Send, Trash2, Users } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { navigateHome } from "../../../utils/homeNavigation";
import { apiClient } from "../../../api/client";
import { getNotificationsHubUrl } from "../../../utils/notificationsHubUrl";
import { markChatScopeRead } from "../../../api/notificationsApi";

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

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
  const onlineUsers = [1, 2];
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

  const handleSelectConversation = async (id: number) => {
    await loadConversationById(id);
  };

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <button type="button" style={S.backBtn} onClick={() => navigateHome(navigate)}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div style={S.layout}>
        <aside style={S.sidebar}>
          <p style={S.sideTitle}>Messages</p>
          {conversations.length === 0 ? (
            <p style={S.emptyText}>Start a conversation</p>
          ) : (
            conversations.map((c) => {
              const otherId = getOtherUserId(c);
              const displayName = getOtherUserDisplayName(c);
              const last = c.messages[c.messages.length - 1];
              const preview =
                last == null ? "No messages yet" : last.deleted ? "Message removed" : last.text;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectConversation(c.id)}
                  onMouseEnter={() => setHoveredConversationId(c.id)}
                  onMouseLeave={() => setHoveredConversationId(null)}
                  style={{
                    ...S.convBtn,
                    ...(hoveredConversationId === c.id ? S.convBtnHover : {}),
                    ...(c.id === selectedConversationId ? S.convBtnActive : {}),
                  }}
                >
                  <div style={S.convTopRow}>
                    <span style={S.convName}>
                      {isGroupConversation(c) ? <Users size={12} /> : null}
                      {displayName}
                      {!isGroupConversation(c) ? (
                        <span style={{ ...S.onlineDot, background: onlineUsers.includes(otherId) ? "#22c55e" : "#94a3b8" }} />
                      ) : null}
                    </span>
                    <span style={S.convTopRight}>
                      {last ? <span style={S.convTime}>{formatTime(last.createdAt)}</span> : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(c.id);
                        }}
                        style={{
                          ...S.deleteIconBtn,
                          opacity: hoveredConversationId === c.id ? 1 : 0,
                        }}
                        aria-label="Delete conversation"
                        title="Delete chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </div>
                  <span style={S.convMeta}>{preview}</span>
                </button>
              );
            })
          )}
        </aside>

        <section style={S.chatPanel}>
          {!selectedConversation ? (
            <div style={S.chatEmpty}>Select a conversation</div>
          ) : (
            <>
              <div style={S.chatHeader}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isGroupConversation(selectedConversation) ? <Users size={14} color="#4f46e5" /> : null}
                    <span style={S.chatHeaderName}>{getOtherUserDisplayName(selectedConversation)}</span>
                    {!isGroupConversation(selectedConversation) ? (
                      <span style={S.statusText}>
                        {onlineUsers.includes(getOtherUserId(selectedConversation)) ? "Online" : "Offline"}
                      </span>
                    ) : null}
                  </div>
                  {isGroupConversation(selectedConversation) ? (
                    <div style={S.participantsRow}>
                      {selectedConversation.users.slice(0, 6).map((uid) => {
                        const n = getSenderName(selectedConversation, uid);
                        return (
                          <span key={uid} style={S.participantPill}>{n}</span>
                        );
                      })}
                      {selectedConversation.users.length > 6 ? (
                        <span style={S.participantPill}>+{selectedConversation.users.length - 6} more</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div style={S.messagesArea}>
                {selectedConversation.messages.length === 0 ? (
                  <p style={S.emptyText}>No messages yet. Say hello.</p>
                ) : (
                  selectedConversation.messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        ...S.bubble,
                        ...(m.senderId === currentUserId ? S.bubbleMe : S.bubbleThem),
                      }}
                      onDoubleClick={() => startEditMessage(m)}
                    >
                      {editingMessageId === m.id ? (
                        <div style={S.editRow}>
                          <input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditMessage();
                              if (e.key === "Escape") {
                                setEditingMessageId(null);
                                setEditingText("");
                              }
                            }}
                            style={S.editInput}
                          />
                          <button type="button" style={S.inlineActionBtn} onClick={saveEditMessage}>
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          {isGroupConversation(selectedConversation) ? (
                            <div style={S.senderNameText}>{getSenderName(selectedConversation, m.senderId)}</div>
                          ) : null}
                          <div>{m.deleted ? "Message removed" : m.text}</div>
                          <div style={S.metaRow}>
                            <span style={S.timeText}>{formatTime(m.createdAt)}</span>
                            {m.edited && !m.deleted ? <span style={S.editedText}>(edited)</span> : null}
                            {m.senderId === currentUserId ? (
                              <>
                                <span style={S.seenText}>{m.seen ? "✔✔" : "✔"}</span>
                                {!m.deleted ? (
                                  <>
                                    <button type="button" style={S.iconBtn} onClick={() => startEditMessage(m)}>
                                      <Pencil size={12} />
                                    </button>
                                    <button type="button" style={S.iconBtn} onClick={() => unsendMessage(m.id)}>
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div style={S.inputRow}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  style={S.input}
                  disabled={!selectedConversation}
                />
                <button type="button" style={S.sendBtn} onClick={sendMessage} disabled={!selectedConversation}>
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef2f7", fontFamily: "DM Sans, sans-serif" },
  topBar: { padding: "12px 16px", borderBottom: "1px solid #e8edf3", background: "#fff" },
  backBtn: {
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    background: "#fff",
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  layout: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: 16,
    display: "grid",
    gridTemplateColumns: "300px minmax(0,1fr)",
    gap: 14,
    height: "calc(100vh - 66px)",
  },
  sidebar: {
    border: "1px solid #e8edf3",
    background: "#ffffff",
    borderRadius: 14,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
    overflowY: "auto",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  sideTitle: { margin: "0 0 4px", fontWeight: 800, fontSize: 14, color: "#0f172a" },
  convBtn: {
    border: "1px solid #eef1f6",
    background: "#ffffff",
    borderRadius: 12,
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  },
  convBtnHover: { background: "#f1f5f9" },
  convBtnActive: { border: "1px solid #c7d2fe", background: "#eef2ff" },
  convTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0 },
  convTopRight: { display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 },
  convName: { fontSize: 13, fontWeight: 700, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" },
  convTime: { fontSize: 10, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" },
  onlineDot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  deleteIconBtn: {
    border: "none",
    background: "transparent",
    color: "#ff4d4f",
    cursor: "pointer",
    transition: "opacity .2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  convMeta: {
    fontSize: 12,
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.35,
    paddingTop: 2,
  },
  chatPanel: {
    border: "1px solid #e8edf3",
    background: "#ffffff",
    borderRadius: 14,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  chatHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #e8edf3",
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  chatHeaderName: { fontWeight: 800, color: "#0f172a", fontSize: 15, letterSpacing: "-0.01em" },
  statusText: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  participantsRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  participantPill: {
    fontSize: 10, fontWeight: 700, color: "#4f46e5",
    border: "1px solid #c7d2fe", background: "#eef2ff",
    borderRadius: 999, padding: "2px 8px",
  },
  messagesArea: { flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" },
  chatEmpty: { minHeight: 420, display: "grid", placeItems: "center", color: "#64748b", fontSize: 13 },
  emptyText: { margin: 0, fontSize: 12, color: "#94a3b8" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    padding: "12px 16px",
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    lineHeight: 1.45,
  },
  bubbleMe: { alignSelf: "flex-end", background: "#7c3aed", color: "#ffffff", borderRadius: 16 },
  bubbleThem: { alignSelf: "flex-start", background: "#eef2f7", color: "#0f172a", borderRadius: 16 },
  senderNameText: { fontSize: 10, fontWeight: 800, color: "#4f46e5" },
  metaRow: { display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" },
  timeText: { fontSize: 10, opacity: 0.85 },
  editedText: { fontSize: 10, opacity: 0.85 },
  seenText: { fontSize: 10, opacity: 0.9 },
  iconBtn: { border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center" },
  editRow: { display: "flex", alignItems: "center", gap: 6 },
  editInput: { flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 8px", fontSize: 12, fontFamily: "inherit" },
  inlineActionBtn: { border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4f46e5", borderRadius: 8, padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  inputRow: {
    borderTop: "1px solid #e8edf3",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fafbfc",
  },
  input: {
    flex: 1,
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "12px 18px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#ffffff",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
    outline: "none",
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "#7c3aed",
    color: "#fff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
