import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getConversations,
  sumConversationUnseen,
  type ConversationListItem,
} from "@/api/conversationsApi";
import { getDoctorMe } from "@/api/meApi";
import {
  getDoctorConversationDisplayName,
  getDoctorConversationKind,
  getDoctorConversationPreview,
  getDoctorConversationSubtitle,
  type DoctorMessagesFilter,
} from "@/lib/doctorMessagesNavigation";

export function useDoctorConversationsList() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filter, setFilter] = useState<DoctorMessagesFilter>("all");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [list, me] = await Promise.all([getConversations(), getDoctorMe().catch(() => null)]);
      setConversations(list);
      setCurrentUserId(me?.userId ?? me?.user?.userId ?? null);
    } catch (err) {
      Alert.alert("Could not load messages", parseApiErrorMessage(err));
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const totalUnread = useMemo(() => sumConversationUnseen(conversations), [conversations]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let items = conversations;

    if (filter !== "all") {
      items = items.filter((item) => getDoctorConversationKind(item) === filter);
    }

    if (!query) return items;

    return items.filter((item) => {
      const name = getDoctorConversationDisplayName(item, currentUserId).toLowerCase();
      const subtitle = getDoctorConversationSubtitle(item, currentUserId).toLowerCase();
      const preview = getDoctorConversationPreview(item).toLowerCase();
      return name.includes(query) || subtitle.includes(query) || preview.includes(query);
    });
  }, [conversations, currentUserId, filter, searchQuery]);

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
    totalUnread,
    filter,
    setFilter,
    searchVisible,
    searchQuery,
    setSearchQuery,
    toggleSearch,
    load,
    removeConversation,
  };
}
