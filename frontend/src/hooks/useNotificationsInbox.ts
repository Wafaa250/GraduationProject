import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAllNotifications,
  getAllNotificationsUnreadCount,
  markAllNotificationsRead,
  markGraduationNotificationRead,
  type GraduationNotification,
} from "@/api/notificationsApi";
import {
  subscribeNotificationCreated,
  subscribeNotificationsHubReconnect,
} from "@/lib/notificationsHub";
import { getNotificationToastTitle } from "@/lib/notificationPresentation";
import { toast } from "@/hooks/use-toast";

type UseNotificationsInboxOptions = {
  role: "student" | "doctor";
  /** Show toast when a new notification arrives in real time. */
  showToasts?: boolean;
  /** Mark all notifications read when the dropdown opens. */
  markAllReadOnOpen?: boolean;
};

export function useNotificationsInbox({
  role,
  showToasts = true,
  markAllReadOnOpen = true,
}: UseNotificationsInboxOptions) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<GraduationNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const openRef = useRef(open);
  const unreadRef = useRef(unreadCount);
  openRef.current = open;
  unreadRef.current = unreadCount;

  const refreshUnread = useCallback(async () => {
    try {
      const count = await getAllNotificationsUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllNotifications(50);
      setNotifications(rows);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([refreshUnread(), refreshList()]);
  }, [refreshUnread, refreshList]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubCreated = subscribeNotificationCreated((payload) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === payload.id)) return prev;
        return [payload, ...prev].slice(0, 50);
      });
      if (!payload.readAt) {
        setUnreadCount((c) => c + 1);
      }
      if (showToasts && !openRef.current) {
        toast({
          title: getNotificationToastTitle(payload),
          description: payload.body?.trim() || undefined,
        });
      }
    });
    const unsubReconnect = subscribeNotificationsHubReconnect(() => {
      void refresh();
    });
    return () => {
      unsubCreated();
      unsubReconnect();
    };
  }, [refresh, showToasts]);

  const toggleOpen = useCallback(() => {
    setOpen((wasOpen) => {
      const next = !wasOpen;
      if (next) {
        void refreshList();
        if (markAllReadOnOpen && unreadRef.current > 0) {
          void (async () => {
            setMarkingAllRead(true);
            try {
              await markAllNotificationsRead();
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
              );
              setUnreadCount(0);
            } finally {
              setMarkingAllRead(false);
            }
          })();
        }
      }
      return next;
    });
  }, [refreshList, markAllReadOnOpen]);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
    } finally {
      setMarkingAllRead(false);
    }
  }, [unreadCount, markingAllRead]);

  const handleNotificationClick = useCallback(
    async (n: GraduationNotification, onNavigate: () => void) => {
      if (!n.readAt) {
        try {
          await markGraduationNotificationRead(n.id);
          setNotifications((prev) =>
            prev.map((row) =>
              row.id === n.id ? { ...row, readAt: new Date().toISOString() } : row,
            ),
          );
          setUnreadCount((count) => Math.max(0, count - 1));
        } catch {
          /* ignore */
        }
      }
      setOpen(false);
      onNavigate();
    },
    [],
  );

  return {
    role,
    open,
    setOpen,
    toggleOpen,
    unreadCount,
    notifications,
    loading,
    markingAllRead,
    refresh,
    handleMarkAllRead,
    handleNotificationClick,
  };
}
