import * as signalR from "@microsoft/signalr";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  deleteConversation,
  fetchConversationDetails,
  fetchConversationsForCurrentUser,
  startConversationWithUser,
  type ApiMessageDto,
  type ConversationListItemDto,
} from "@/api/conversationsApi";
import {
  editMessage,
  markConversationMessagesSeen,
  sendMessage,
  unsendMessage,
} from "@/api/messagesApi";
import { markChatScopeRead } from "@/api/notificationsApi";
import { spacing } from "@/constants/responsiveLayout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getItem } from "@/utils/authStorage";
import { getNotificationsHubUrl } from "@/utils/notificationsHubUrl";

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
  otherUserName?: string;
  unseenCount: number;
};

function pickNumericParam(v: string | string[] | undefined): number | null {
  if (v == null) return null;
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mapApiMessage(m: ApiMessageDto): Message {
  return {
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    createdAt: new Date(m.createdAt),
    edited: Boolean(m.edited),
    deleted: Boolean(m.deleted),
    seen: Boolean(m.seen),
  };
}

function getConversationIdFromHubPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const cid = (payload as { conversationId?: unknown }).conversationId;
  return typeof cid === "number" && Number.isFinite(cid) ? cid : null;
}

function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[p.length - 1][0] ?? ""}`.toUpperCase();
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { horizontalPadding, isTablet, width } = useResponsiveLayout();
  const { userId: userIdParam, conversationId: conversationIdParam } = useLocalSearchParams<{
    userId?: string | string[];
    conversationId?: string | string[];
  }>();

  const targetUserId = pickNumericParam(userIdParam);
  const requestedConversationId = pickNumericParam(conversationIdParam);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userIdReady, setUserIdReady] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [phoneShowList, setPhoneShowList] = useState(true);

  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const [listLoading, setListLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadRefreshing, setThreadRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [hubState, setHubState] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  const messagesListRef = useRef<FlatList<Message>>(null);
  const selectedConversationIdRef = useRef<number | null>(null);

  const pad = horizontalPadding;
  const listWidth = isTablet ? Math.min(320, Math.round(width * 0.36)) : width;

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const goHome = useCallback(async () => {
    const role = ((await getItem("role")) ?? "").toString().trim().toLowerCase();
    router.replace((role === "doctor" ? "/doctor-dashboard" : "/dashboard") as Href);
  }, [router]);

  const handleBack = useCallback(() => {
    if (!isTablet && selectedConversationId != null && !phoneShowList) {
      setPhoneShowList(true);
      return;
    }
    if (router.canGoBack()) router.back();
    else void goHome();
  }, [goHome, isTablet, phoneShowList, router, selectedConversationId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = ((await getItem("userId")) ?? "").trim();
      const n = Number(raw);
      if (!cancelled) {
        setCurrentUserId(Number.isFinite(n) && n > 0 ? n : null);
        setUserIdReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mapListRows = useCallback(
    (data: ConversationListItemDto[], selfId: number): Conversation[] => {
      const mapped = data.map((c) => {
        const apiUsers = Array.isArray(c.users) ? c.users : [];
        const users =
          apiUsers.length > 0
            ? apiUsers.map((u) => u.id)
            : [selfId, c.otherUser?.id ?? 0].filter((id) => id > 0);
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
          unseenCount: typeof c.unseenCount === "number" ? c.unseenCount : 0,
        } satisfies Conversation;
      });

      const dedupedByOtherUser = new Map<number, Conversation>();
      const groupConversations: Conversation[] = [];
      for (const conv of mapped) {
        if (conv.users.length !== 2) {
          groupConversations.push(conv);
          continue;
        }
        const otherUserId = conv.users.find((u) => u !== selfId) ?? 0;
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

      return [...dedupedByOtherUser.values(), ...groupConversations].sort(
        (a, b) =>
          (b.messages[b.messages.length - 1]?.createdAt?.getTime() ?? 0) -
          (a.messages[a.messages.length - 1]?.createdAt?.getTime() ?? 0),
      );
    },
    [],
  );

  const loadConversations = useCallback(async () => {
    if (currentUserId == null || currentUserId <= 0) {
      setListError("Missing user session. Please sign in again.");
      setConversations([]);
      return;
    }
    setListError(null);
    try {
      const data = await fetchConversationsForCurrentUser();
      setConversations(mapListRows(data, currentUserId));
    } catch (e) {
      setConversations([]);
      setListError(parseApiErrorMessage(e));
    }
  }, [currentUserId, mapListRows]);

  useEffect(() => {
    if (!userIdReady) return;
    let cancelled = false;
    (async () => {
      setListLoading(true);
      await loadConversations();
      if (!cancelled) setListLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userIdReady, currentUserId, loadConversations]);

  const loadConversationById = useCallback(
    async (conversationId: number): Promise<number | null> => {
      if (currentUserId == null || currentUserId <= 0) return null;
      setThreadError(null);
      setThreadLoading(true);
      try {
        const data = await fetchConversationDetails(conversationId);
        const other = data.users.find((u) => u.id !== currentUserId);
        const nameFromDetail = other?.name?.trim();
        const mapped: Conversation = {
          id: data.id,
          title: data.title ?? undefined,
          courseTeamId: data.courseTeamId ?? null,
          users: data.users.map((u) => u.id),
          participantNames: Object.fromEntries(data.users.map((u) => [u.id, (u.name ?? "").trim()])),
          messages: [...data.messages].map(mapApiMessage).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
          otherUserName: nameFromDetail,
          unseenCount: 0,
        };

        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === mapped.id);
          if (idx === -1) return [mapped, ...prev];
          const next = [...prev];
          const prevName = next[idx].otherUserName;
          const prevUnseen = next[idx].unseenCount;
          next[idx] = {
            ...mapped,
            otherUserName: mapped.otherUserName || prevName,
            unseenCount: mapped.id === selectedConversationIdRef.current ? 0 : prevUnseen,
          };
          return next;
        });

        setSelectedConversationId(mapped.id);
        return mapped.id;
      } catch (e) {
        setThreadError(parseApiErrorMessage(e));
        return null;
      } finally {
        setThreadLoading(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getNotificationsHubUrl(), {
        accessTokenFactory: async () => ((await getItem("token")) ?? "").trim(),
      })
      .withAutomaticReconnect()
      .build();

    setHubState("connecting");

    connection.on("ReceiveMessage", (payload: unknown) => {
      try {
        const convId = getConversationIdFromHubPayload(payload) ?? selectedConversationIdRef.current;
        if (convId == null) return;
        const msg = mapApiMessage(payload as ApiMessageDto);

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
        const raw =
          payload && typeof payload === "object" && "payload" in payload ? (payload as { payload: unknown }).payload : payload;
        const msg = mapApiMessage(raw as ApiMessageDto);
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
        const actualPayload =
          payload && typeof payload === "object" && "payload" in payload
            ? (payload as { payload: unknown }).payload
            : payload;
        if (!actualPayload || typeof actualPayload !== "object" || !("id" in actualPayload)) return;
        const rawId = (actualPayload as { id: unknown }).id;
        const messageId = typeof rawId === "number" ? rawId : Number(rawId);
        if (!Number.isFinite(messageId)) return;

        if ("createdAt" in (actualPayload as object)) {
          const msg = mapApiMessage(actualPayload as ApiMessageDto);
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

    void connection
      .start()
      .then(() => {
        setHubState("connected");
      })
      .catch((err) => {
        console.error("SignalR connection start", err);
        setHubState("error");
      });

    return () => {
      connection.off("ReceiveMessage");
      connection.off("MessageEdited");
      connection.off("MessageDeleted");
      void connection.stop().catch((err) => {
        console.error("SignalR connection stop", err);
      });
      setHubState("idle");
    };
  }, []);

  useEffect(() => {
    if (!userIdReady || targetUserId == null || currentUserId == null) return;

    let cancelled = false;
    (async () => {
      try {
        const conversationId = await startConversationWithUser(targetUserId);
        if (cancelled) return;
        await loadConversationById(conversationId);
        if (cancelled) return;
        await loadConversations();
        if (!isTablet) {
          setPhoneShowList(false);
        }
      } catch (e) {
        if (!cancelled) {
          Alert.alert("Messages", parseApiErrorMessage(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, isTablet, loadConversationById, loadConversations, targetUserId, userIdReady]);

  useEffect(() => {
    if (!userIdReady || requestedConversationId == null || currentUserId == null) return;

    let cancelled = false;
    (async () => {
      await loadConversationById(requestedConversationId);
      if (cancelled) return;
      await loadConversations();
      if (!isTablet) {
        setPhoneShowList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, isTablet, loadConversationById, loadConversations, requestedConversationId, userIdReady]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    if (selectedConversationId == null || currentUserId == null) return;

    void markConversationMessagesSeen(selectedConversationId).catch((err) => {
      console.error("Failed to mark conversation as seen", err);
    });
    void markChatScopeRead(`direct:${selectedConversationId}`).catch(() => undefined);

    setConversations((prev) =>
      prev.map((c) =>
        c.id !== selectedConversationId
          ? c
          : {
              ...c,
              unseenCount: 0,
              messages: c.messages.map((m) => (m.senderId !== currentUserId ? { ...m, seen: true } : m)),
            },
      ),
    );
  }, [selectedConversationId, currentUserId]);

  useEffect(() => {
    const t = setTimeout(() => {
      messagesListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [selectedConversation?.messages.length, selectedConversationId]);

  // Refresh on focus — re-fetch the conversation list and the currently selected
  // conversation whenever the screen regains focus (e.g. coming back from the
  // team workspace or the background). SignalR keeps things live while mounted,
  // but on mobile the OS may suspend the socket, so refreshing on focus ensures
  // messages are never stale after re-entering the chat tab — matching the
  // implicit "always-live" feel of the web ChatPage.
  useFocusEffect(
    useCallback(() => {
      if (!userIdReady || currentUserId == null) return;
      void loadConversations();
      const id = selectedConversationIdRef.current;
      if (id != null) void loadConversationById(id);
    }, [currentUserId, loadConversationById, loadConversations, userIdReady]),
  );

  const onRefreshList = useCallback(async () => {
    setListRefreshing(true);
    try {
      await loadConversations();
    } finally {
      setListRefreshing(false);
    }
  }, [loadConversations]);

  const onRefreshThread = useCallback(async () => {
    if (selectedConversationId == null) return;
    setThreadRefreshing(true);
    try {
      await loadConversationById(selectedConversationId);
      await loadConversations();
    } finally {
      setThreadRefreshing(false);
    }
  }, [loadConversationById, loadConversations, selectedConversationId]);

  const handleSelectConversation = useCallback(
    async (id: number) => {
      await loadConversationById(id);
      if (!isTablet) {
        setPhoneShowList(false);
      }
    },
    [isTablet, loadConversationById],
  );

  const getOtherUserId = (conversation: Conversation) =>
    conversation.users.find((u) => u !== (currentUserId ?? 0)) ?? conversation.users[0] ?? 0;

  const isGroupConversation = (conversation: Conversation) =>
    conversation.users.length > 2 || !!conversation.courseTeamId;

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

  const confirmDeleteConversation = (id: number) => {
    Alert.alert("Delete chat", "Remove this conversation for you?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void handleDeleteConversation(id),
      },
    ]);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
        setEditingMessageId(null);
        setEditingText("");
        if (!isTablet) setPhoneShowList(true);
      }
    } catch (e) {
      Alert.alert("Messages", parseApiErrorMessage(e));
    }
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text || selectedConversationId == null) return;
    try {
      await sendMessage(selectedConversationId, text);
      await loadConversationById(selectedConversationId);
      await loadConversations();
      setInput("");
    } catch (e) {
      Alert.alert("Send failed", parseApiErrorMessage(e));
    }
  };

  const startEditMessage = (message: Message) => {
    if (message.senderId !== currentUserId || message.deleted) return;
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const saveEditMessage = async () => {
    const text = editingText.trim();
    if (selectedConversationId == null || editingMessageId == null || !text) return;
    try {
      await editMessage(editingMessageId, text);
      await loadConversationById(selectedConversationId);
      setEditingMessageId(null);
      setEditingText("");
    } catch (e) {
      Alert.alert("Edit failed", parseApiErrorMessage(e));
    }
  };

  const confirmUnsend = (messageId: number) => {
    Alert.alert("Remove message", "Delete this message for everyone?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void runUnsend(messageId),
      },
    ]);
  };

  const runUnsend = async (messageId: number) => {
    if (selectedConversationId == null) return;
    try {
      await unsendMessage(messageId);
      await loadConversationById(selectedConversationId);
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setEditingText("");
      }
    } catch (e) {
      Alert.alert("Delete failed", parseApiErrorMessage(e));
    }
  };

  const kavBehavior = Platform.OS === "ios" ? "padding" : undefined;

  const showListPane = isTablet || phoneShowList;
  const showThreadPane = isTablet || !phoneShowList;

  const renderConversationItem = ({ item: c }: { item: Conversation }) => {
    const displayName = getOtherUserDisplayName(c);
    const last = c.messages[c.messages.length - 1];
    const preview = last == null ? "No messages yet" : last.deleted ? "Message removed" : last.text;
    const active = c.id === selectedConversationId;

    return (
      <Pressable
        onPress={() => void handleSelectConversation(c.id)}
        onLongPress={() => confirmDeleteConversation(c.id)}
        style={({ pressed }) => [
          styles.convBtn,
          active && styles.convBtnActive,
          pressed && styles.convBtnPressed,
        ]}
      >
        <View style={styles.convTopRow}>
          <View style={styles.convAvatar}>
            <Text style={styles.convAvatarText}>{initialsOf(displayName)}</Text>
          </View>
          <View style={styles.convMain}>
            <View style={styles.convTitleRow}>
              <View style={styles.convNameRow}>
                {isGroupConversation(c) ? <Ionicons name="people" size={12} color="#4f46e5" style={{ marginRight: 4 }} /> : null}
                <Text style={styles.convName} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
              {last ? <Text style={styles.convTime}>{formatTime(last.createdAt)}</Text> : null}
            </View>
            <View style={styles.convPreviewRow}>
              <Text style={styles.convMeta} numberOfLines={2}>
                {preview}
              </Text>
              {c.unseenCount > 0 ? (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>{c.unseenCount > 99 ? "99+" : String(c.unseenCount)}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={() => confirmDeleteConversation(c.id)}
            hitSlop={10}
            style={styles.convTrash}
            accessibilityLabel="Delete conversation"
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderMessage = ({ item: m }: { item: Message }) => {
    if (!selectedConversation) return <View />;
    const mine = m.senderId === currentUserId;
    const group = isGroupConversation(selectedConversation);

    return (
      <Pressable
        onLongPress={() => (mine ? startEditMessage(m) : undefined)}
        style={[styles.bubbleWrap, mine ? styles.bubbleWrapMe : styles.bubbleWrapThem, { maxWidth: "88%" }]}
      >
        <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
          {editingMessageId === m.id ? (
            <View style={styles.editRow}>
              <TextInput
                value={editingText}
                onChangeText={setEditingText}
                style={styles.editInput}
                multiline
                placeholder="Edit message…"
              />
              <Pressable onPress={() => void saveEditMessage()} style={styles.saveEditBtn}>
                <Text style={styles.saveEditBtnText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {group ? <Text style={styles.senderNameText}>{getSenderName(selectedConversation, m.senderId)}</Text> : null}
              <Text style={[styles.bubbleText, mine && styles.bubbleTextMe]}>{m.deleted ? "Message removed" : m.text}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.timeText, mine && styles.timeTextMe]}>{formatTime(m.createdAt)}</Text>
                {m.edited && !m.deleted ? (
                  <Text style={[styles.editedText, mine && styles.editedTextMe]}>(edited)</Text>
                ) : null}
                {mine ? (
                  <>
                    <Text style={[styles.seenText, mine && styles.seenTextMe]}>{m.seen ? "✔✔" : "✔"}</Text>
                    {!m.deleted ? (
                      <>
                        <Pressable hitSlop={8} onPress={() => startEditMessage(m)} accessibilityLabel="Edit message">
                          <Ionicons name="pencil" size={12} color={mine ? "#ede9fe" : "#64748b"} />
                        </Pressable>
                        <Pressable hitSlop={8} onPress={() => confirmUnsend(m.id)} accessibilityLabel="Delete message">
                          <Ionicons name="trash-outline" size={12} color={mine ? "#fecaca" : "#64748b"} />
                        </Pressable>
                      </>
                    ) : null}
                  </>
                ) : null}
              </View>
            </>
          )}
        </View>
      </Pressable>
    );
  };

  const hubLabel =
    hubState === "connected" ? "Live" : hubState === "connecting" ? "Connecting…" : hubState === "error" ? "Offline" : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={kavBehavior}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
      >
        <View style={[styles.topBar, { paddingHorizontal: pad }]}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#64748b" />
            <Text style={styles.backBtnText}>
              {!isTablet && selectedConversationId != null && !phoneShowList ? "Chats" : "Back"}
            </Text>
          </Pressable>
          {hubLabel ? (
            <View style={styles.hubPill}>
              <View style={[styles.hubDot, hubState === "connected" && styles.hubDotOn]} />
              <Text style={styles.hubPillText}>{hubLabel}</Text>
            </View>
          ) : null}
        </View>

        {listError && !listLoading ? (
          <View style={[styles.bannerErr, { marginHorizontal: pad }]}>
            <Text style={styles.bannerErrText}>{listError}</Text>
          </View>
        ) : null}

        <View style={[styles.layoutRow, { paddingHorizontal: isTablet ? pad : 0, flex: 1 }]}>
          {showListPane ? (
            <View style={[styles.listCol, { width: isTablet ? listWidth : width }]}>
              <View style={[styles.listHeader, { paddingHorizontal: isTablet ? 0 : pad }]}>
                <Text style={styles.sideTitle}>Messages</Text>
              </View>
              {listLoading ? (
                <View style={styles.listLoading}>
                  <ActivityIndicator color="#6366f1" />
                  <Text style={styles.muted}>Loading conversations…</Text>
                </View>
              ) : (
                <FlatList
                  data={conversations}
                  keyExtractor={(c) => String(c.id)}
                  renderItem={renderConversationItem}
                  contentContainerStyle={{
                    paddingHorizontal: isTablet ? spacing.sm : pad,
                    paddingBottom: Math.max(insets.bottom, spacing.lg),
                    flexGrow: 1,
                  }}
                  refreshControl={<RefreshControl refreshing={listRefreshing} onRefresh={() => void onRefreshList()} />}
                  ListEmptyComponent={
                    <View style={styles.emptyList}>
                      <Text style={styles.emptyTitle}>No conversations yet</Text>
                      <Text style={styles.muted}>Open a profile and tap Message to start chatting.</Text>
                    </View>
                  }
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </View>
          ) : null}

          {isTablet ? <View style={styles.divider} /> : null}

          {showThreadPane ? (
            <View style={styles.threadCol}>
              {!selectedConversation ? (
                <View style={styles.chatEmpty}>
                  <Ionicons name="chatbubbles-outline" size={40} color="#94a3b8" />
                  <Text style={styles.chatEmptyTitle}>Select a conversation</Text>
                  <Text style={styles.muted}>Choose a chat from the list.</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.chatHeader, { paddingHorizontal: pad }]}>
                    <View style={styles.chatHeaderLeft}>
                      <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>{initialsOf(getOtherUserDisplayName(selectedConversation))}</Text>
                      </View>
                      <View>
                        <View style={styles.chatHeaderTitleRow}>
                          {isGroupConversation(selectedConversation) ? (
                            <Ionicons name="people" size={14} color="#4f46e5" style={{ marginRight: 4 }} />
                          ) : null}
                          <Text style={styles.chatHeaderName}>{getOtherUserDisplayName(selectedConversation)}</Text>
                        </View>
                        {isGroupConversation(selectedConversation) ? (
                          <View style={styles.participantsRow}>
                            {selectedConversation.users.slice(0, 6).map((uid) => (
                              <View key={uid} style={styles.participantPill}>
                                <Text style={styles.participantPillText}>{getSenderName(selectedConversation, uid)}</Text>
                              </View>
                            ))}
                            {selectedConversation.users.length > 6 ? (
                              <View style={styles.participantPill}>
                                <Text style={styles.participantPillText}>+{selectedConversation.users.length - 6}</Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {threadError ? (
                    <View style={[styles.bannerErr, { marginHorizontal: pad, marginTop: 8 }]}>
                      <Text style={styles.bannerErrText}>{threadError}</Text>
                    </View>
                  ) : null}

                  {threadLoading ? (
                    <View style={styles.threadLoading}>
                      <ActivityIndicator color="#6366f1" />
                    </View>
                  ) : null}

                  <FlatList
                    ref={messagesListRef}
                    data={selectedConversation.messages}
                    keyExtractor={(m) => String(m.id)}
                    renderItem={renderMessage}
                    contentContainerStyle={{
                      paddingHorizontal: pad,
                      paddingTop: spacing.md,
                      paddingBottom: spacing.sm,
                      flexGrow: 1,
                    }}
                    onContentSizeChange={() => messagesListRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={
                      <View style={styles.emptyThread}>
                        <Text style={styles.muted}>No messages yet. Say hello.</Text>
                      </View>
                    }
                    refreshControl={
                      <RefreshControl refreshing={threadRefreshing} onRefresh={() => void onRefreshThread()} />
                    }
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                  />

                  <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, spacing.sm), paddingHorizontal: pad }]}>
                    <TextInput
                      value={input}
                      onChangeText={setInput}
                      placeholder="Type a message…"
                      placeholderTextColor="#94a3b8"
                      style={styles.input}
                      multiline
                      maxLength={2000}
                      editable={!!selectedConversation}
                    />
                    <Pressable
                      onPress={() => void onSend()}
                      style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                      disabled={!selectedConversation || !input.trim()}
                    >
                      <Ionicons name="send" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#eef2f7" },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8edf3",
    backgroundColor: "#fff",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  hubPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#f1f5f9" },
  hubDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#94a3b8" },
  hubDotOn: { backgroundColor: "#22c55e" },
  hubPillText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  bannerErr: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  bannerErrText: { color: "#b91c1c", fontSize: 12, fontWeight: "600" },
  layoutRow: { flexDirection: "row", minHeight: 0, minWidth: 0 },
  listCol: { backgroundColor: "#fff", borderRightWidth: 0, minHeight: 0 },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: "#e8edf3" },
  threadCol: { flex: 1, minHeight: 0, minWidth: 0, backgroundColor: "#fff" },
  listHeader: { paddingTop: spacing.sm, paddingBottom: 4 },
  sideTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  listLoading: { padding: 24, alignItems: "center", gap: 8 },
  muted: { fontSize: 12, color: "#94a3b8", textAlign: "center" },
  convBtn: {
    borderWidth: 1,
    borderColor: "#eef1f6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  convBtnActive: { borderColor: "#c7d2fe", backgroundColor: "#eef2ff" },
  convBtnPressed: { opacity: 0.92 },
  convTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  convAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  convAvatarText: { fontSize: 13, fontWeight: "800", color: "#4338ca" },
  convMain: { flex: 1, minWidth: 0 },
  convTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  convName: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: "700", color: "#0f172a" },
  convTime: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  convPreviewRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  convMeta: { flex: 1, fontSize: 12, color: "#64748b" },
  unreadPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  convTrash: { padding: 4 },
  emptyList: { padding: 24, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  chatEmpty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  chatEmptyTitle: { fontSize: 15, fontWeight: "700", color: "#475569" },
  chatHeader: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8edf3",
    backgroundColor: "#fff",
  },
  chatHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { fontSize: 14, fontWeight: "800", color: "#4338ca" },
  chatHeaderTitleRow: { flexDirection: "row", alignItems: "center" },
  chatHeaderName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  participantsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  participantPill: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  participantPillText: { fontSize: 10, fontWeight: "700", color: "#4f46e5" },
  threadLoading: { paddingVertical: 8 },
  emptyThread: { paddingVertical: 40, alignItems: "center" },
  bubbleWrap: { marginBottom: 8 },
  convNameRow: { flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 },
  bubbleWrapMe: { alignSelf: "flex-end" },
  bubbleWrapThem: { alignSelf: "flex-start" },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: { backgroundColor: "#7c3aed" },
  bubbleThem: { backgroundColor: "#eef2f7" },
  bubbleText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
  bubbleTextMe: { color: "#fff" },
  senderNameText: { fontSize: 10, fontWeight: "800", color: "#4f46e5", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 4 },
  timeText: { fontSize: 10, color: "#64748b" },
  timeTextMe: { color: "#ede9fe", opacity: 0.9 },
  editedText: { fontSize: 10, color: "#64748b" },
  editedTextMe: { color: "#ede9fe", opacity: 0.9 },
  seenText: { fontSize: 10, color: "#64748b" },
  seenTextMe: { color: "#fff", opacity: 0.85 },
  editRow: { gap: 8 },
  editInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "#fff",
    minHeight: 40,
  },
  saveEditBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  saveEditBtnText: { fontSize: 12, fontWeight: "800", color: "#4f46e5" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e8edf3",
    paddingTop: 10,
    backgroundColor: "#fafbfc",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    color: "#0f172a",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.45 },
});
