import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import type { GraduationNotification } from "@/api/notificationsApi";
import {
  subscribeNotificationCreated,
  subscribeNotificationsHubReconnect,
} from "@/lib/notificationsHub";

type Options = {
  fetchCount: () => Promise<number>;
  /** When set, only hub events matching this filter increment the badge. */
  matchesCreated?: (payload: GraduationNotification) => boolean;
};

export function useNotificationUnreadCount({ fetchCount, matchesCreated }: Options) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      setUnreadCount(await fetchCount());
    } catch {
      setUnreadCount(0);
    }
  }, [fetchCount]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnread();
    }, [refreshUnread]),
  );

  useEffect(() => {
    const unsubCreated = subscribeNotificationCreated((payload) => {
      if (matchesCreated && !matchesCreated(payload)) return;
      if (!payload.readAt) {
        setUnreadCount((count) => count + 1);
      }
    });
    const unsubReconnect = subscribeNotificationsHubReconnect(() => {
      void refreshUnread();
    });
    return () => {
      unsubCreated();
      unsubReconnect();
    };
  }, [matchesCreated, refreshUnread]);

  return { unreadCount, refreshUnread };
}
