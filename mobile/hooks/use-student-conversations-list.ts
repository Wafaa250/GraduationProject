import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getConversations,
  sumConversationUnseen,
  type ConversationListItem,
} from "@/api/conversationsApi";
import { getMe } from "@/api/meApi";
import {
  loadMutedConversationIds,
  loadPinnedConversationIds,
  toggleMutedConversationId,
  togglePinnedConversationId,
} from "@/lib/messageListPreferences";
import {
  getStudentConversationDisplayName,
  getStudentConversationPreview,
  getStudentConversationSubtitle,
} from "@/lib/studentMessagesNavigation";

function sortConversations(
  items: ConversationListItem[],
  pinnedIds: Set<number>,
): ConversationListItem[] {
  return [...items].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id) ? 1 : 0;
    const bPinned = pinnedIds.has(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function useStudentConversationsList() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [mutedIds, setMutedIds] = useState<Set<number>>(new Set());
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [list, me, pinned, muted] = await Promise.all([
        getConversations(),
        getMe().catch(() => null),
        loadPinnedConversationIds(),
        loadMutedConversationIds(),
      ]);
      setConversations(list);
      setCurrentUserId(me?.userId ?? null);
      setPinnedIds(pinned);
      setMutedIds(muted);
    } catch (err) {
      Alert.alert("Could not load messages", parseApiErrorMessage(err));
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const totalUnread = useMemo(() => sumConversationUnseen(conversations), [conversations]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sorted = sortConversations(conversations, pinnedIds);

    if (!query) return sorted;

    return sorted.filter((item) => {
      const name = getStudentConversationDisplayName(item, currentUserId).toLowerCase();
      const subtitle = getStudentConversationSubtitle(item, currentUserId).toLowerCase();
      const preview = getStudentConversationPreview(item).toLowerCase();
      return name.includes(query) || subtitle.includes(query) || preview.includes(query);
    });
  }, [conversations, currentUserId, pinnedIds, searchQuery]);

  const handleTogglePin = async (id: number) => {
    const next = await togglePinnedConversationId(id);
    setPinnedIds(next);
  };

  const handleToggleMute = async (id: number) => {
    const next = await toggleMutedConversationId(id);
    setMutedIds(next);
  };

  const toggleSearch = () => {
    setSearchVisible((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  };

  const removeConversation = useCallback((id: number) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    loading,
    refreshing,
    conversations,
    filteredConversations,
    currentUserId,
    pinnedIds,
    mutedIds,
    totalUnread,
    searchVisible,
    searchQuery,
    setSearchQuery,
    toggleSearch,
    load,
    removeConversation,
    handleTogglePin,
    handleToggleMute,
  };
}
