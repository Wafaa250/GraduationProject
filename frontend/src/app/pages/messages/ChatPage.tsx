import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Pencil, Send, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { navigateHome } from "../../../utils/homeNavigation";

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
  messages: Message[];
};

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = Number(searchParams.get("userId") ?? 0);
  const currentUserId = Number(localStorage.getItem("userId") ?? 1);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [hoveredConversationId, setHoveredConversationId] = useState<number | null>(null);
  const [nextMessageId, setNextMessageId] = useState(1);
  const [nextConversationId, setNextConversationId] = useState(1);
  const onlineUsers = [1, 2];
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!targetUserId || !Number.isFinite(targetUserId) || targetUserId <= 0) return;

    setConversations((prev) => {
      const existing = prev.find(
        (c) =>
          c.users.length === 2 &&
          c.users.includes(currentUserId) &&
          c.users.includes(targetUserId),
      );

      if (existing) {
        setSelectedConversationId(existing.id);
        return prev;
      }

      const created: Conversation = {
        id: nextConversationId,
        users: [currentUserId, targetUserId],
        messages: [],
      };
      setSelectedConversationId(created.id);
      setNextConversationId((id) => id + 1);
      return [created, ...prev];
    });
  }, [targetUserId, currentUserId, nextConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    if (!selectedConversationId) return;
    // Mark other user's messages as seen on open/select.
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== selectedConversationId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.senderId !== currentUserId ? { ...m, seen: true } : m,
              ),
            },
      ),
    );
  }, [selectedConversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedConversation?.messages.length, selectedConversationId]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !selectedConversationId) return;

    const message: Message = {
      id: nextMessageId,
      senderId: currentUserId,
      text,
      createdAt: new Date(),
      seen: false,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversationId ? { ...c, messages: [...c.messages, message] } : c)),
    );
    setNextMessageId((id) => id + 1);
    setInput("");
  };

  const startEditMessage = (message: Message) => {
    if (message.senderId !== currentUserId || message.deleted) return;
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const saveEditMessage = () => {
    const text = editingText.trim();
    if (!selectedConversationId || !editingMessageId || !text) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== selectedConversationId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id === editingMessageId ? { ...m, text, edited: true } : m,
              ),
            },
      ),
    );
    setEditingMessageId(null);
    setEditingText("");
  };

  const unsendMessage = (messageId: number) => {
    if (!selectedConversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== selectedConversationId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId && m.senderId === currentUserId
                  ? { ...m, deleted: true, text: "Message removed", edited: false }
                  : m,
              ),
            },
      ),
    );
    if (editingMessageId === messageId) {
      setEditingMessageId(null);
      setEditingText("");
    }
  };

  const handleDeleteConversation = (id: number) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedConversationId === id) {
      setSelectedConversationId(null);
      setEditingMessageId(null);
      setEditingText("");
    }
  };

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getOtherUserId = (conversation: Conversation) =>
    conversation.users.find((u) => u !== currentUserId) ?? conversation.users[0] ?? 0;

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
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConversationId(c.id)}
                  onMouseEnter={() => setHoveredConversationId(c.id)}
                  onMouseLeave={() => setHoveredConversationId(null)}
                  style={{
                    ...S.convBtn,
                    ...(c.id === selectedConversationId ? S.convBtnActive : {}),
                  }}
                >
                  <div style={S.convTopRow}>
                    <span style={S.convName}>
                      User {otherId}
                      <span style={{ ...S.onlineDot, background: onlineUsers.includes(otherId) ? "#22c55e" : "#94a3b8" }} />
                    </span>
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
                  </div>
                  <span style={S.convMeta}>{last ? last.text : "No messages yet"}</span>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>User {getOtherUserId(selectedConversation)}</span>
                  <span style={S.statusText}>
                    {onlineUsers.includes(getOtherUserId(selectedConversation)) ? "Online" : "Offline"}
                  </span>
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
                          <div>{m.deleted ? "Message removed" : m.text}</div>
                          <div style={S.metaRow}>
                            <span style={S.timeText}>{formatTime(m.createdAt)}</span>
                            {m.edited && !m.deleted ? <span style={S.editedText}>(edited)</span> : null}
                            {m.senderId === currentUserId ? (
                              <>
                                <span style={S.seenText}>
                                  {m.seen ? "✔✔ seen" : "✔ sent"}
                                </span>
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
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "DM Sans, sans-serif" },
  topBar: { padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#fff" },
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
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 0,
    overflowY: "auto",
  },
  sideTitle: { margin: "0 0 4px", fontWeight: 800, fontSize: 14, color: "#0f172a" },
  convBtn: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 10,
    padding: "10px 12px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  convBtnActive: { border: "1px solid #c7d2fe", background: "#eef2ff" },
  convTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  convName: { fontSize: 13, fontWeight: 700, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 6 },
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
  convMeta: { fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  chatPanel: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 12,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  chatHeader: { padding: "12px 14px", borderBottom: "1px solid #e2e8f0", fontSize: 14, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  statusText: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  messagesArea: { flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" },
  chatEmpty: { minHeight: 420, display: "grid", placeItems: "center", color: "#64748b", fontSize: 13 },
  emptyText: { margin: 0, fontSize: 12, color: "#94a3b8" },
  bubble: { maxWidth: "75%", borderRadius: 10, padding: "8px 10px", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 },
  bubbleMe: { alignSelf: "flex-end", background: "#7c3aed", color: "#fff" },
  bubbleThem: { alignSelf: "flex-start", background: "#f1f5f9", color: "#0f172a" },
  metaRow: { display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" },
  timeText: { fontSize: 10, opacity: 0.85 },
  editedText: { fontSize: 10, opacity: 0.85 },
  seenText: { fontSize: 10, opacity: 0.9 },
  iconBtn: { border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center" },
  editRow: { display: "flex", alignItems: "center", gap: 6 },
  editInput: { flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 8px", fontSize: 12, fontFamily: "inherit" },
  inlineActionBtn: { border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4f46e5", borderRadius: 8, padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  inputRow: { borderTop: "1px solid #e2e8f0", padding: 10, display: "flex", alignItems: "center", gap: 8 },
  input: { flex: 1, border: "1px solid #d1d5db", borderRadius: 999, padding: "9px 12px", fontSize: 13, fontFamily: "inherit" },
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
