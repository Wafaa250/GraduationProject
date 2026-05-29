import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCompanyNotifications,
  getCompanyNotificationsUnreadCount,
  markCompanyNotificationRead,
  type AppNotification,
} from "@/api/notificationsApi";
import {
  normalizeNotificationCreatedPayload,
  subscribeNotificationCreated,
  subscribeNotificationsHubReconnected,
} from "@/lib/notificationsHub";
import { COMPANY_ROUTES } from "@/routes/paths";

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function resolveNotificationTarget(eventType: string, projectId: number | null): string | null {
  const requestId = projectId;

  if (
    eventType === "company_ai_recommendations_ready" ||
    eventType === "company_team_recommendations_ready"
  ) {
    return requestId ? COMPANY_ROUTES.requestRecommendations(requestId) : COMPANY_ROUTES.requests;
  }

  if (
    eventType === "company_student_recommendation_saved" ||
    eventType === "company_team_recommendation_saved"
  ) {
    return requestId ? COMPANY_ROUTES.requestRecommendations(requestId) : COMPANY_ROUTES.saved;
  }

  if (
    eventType === "company_request_paused" ||
    eventType === "company_request_reactivated" ||
    eventType === "company_request_closed"
  ) {
    return requestId ? COMPANY_ROUTES.requestDetail(requestId) : COMPANY_ROUTES.requests;
  }

  if (eventType === "company_member_added" || eventType === "company_member_removed") {
    return COMPANY_ROUTES.members;
  }

  return COMPANY_ROUTES.dashboard;
}

export function CompanyNotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [items, count] = await Promise.all([
        getCompanyNotifications(50),
        getCompanyNotificationsUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      /* ignore load errors */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubCreated = subscribeNotificationCreated((payload) => {
      const normalized = normalizeNotificationCreatedPayload(payload);
      if (!normalized || normalized.category !== "company") return;

      setNotifications((prev) => {
        if (prev.some((n) => n.id === normalized.id)) return prev;
        const next: AppNotification = {
          id: normalized.id,
          category: normalized.category,
          title: normalized.title,
          body: normalized.body,
          eventType: normalized.eventType,
          projectId: normalized.projectId,
          createdAt: normalized.createdAt,
          readAt: normalized.readAt,
        };
        return [next, ...prev].slice(0, 50);
      });

      if (!normalized.readAt) {
        setUnreadCount((c) => c + 1);
      }
    });

    const unsubReconnect = subscribeNotificationsHubReconnected(() => {
      void refresh();
    });

    return () => {
      unsubCreated();
      unsubReconnect();
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const onNotificationClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      void markCompanyNotificationRead(notification.id).then(() => {
        setNotifications((prev) =>
          prev.map((row) =>
            row.id === notification.id ? { ...row, readAt: new Date().toISOString() } : row,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      });
    }

    setOpen(false);
    const target = resolveNotificationTarget(notification.eventType, notification.projectId);
    if (target) navigate(target);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-xl shrink-0"
        aria-expanded={open}
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <Card className="absolute right-0 top-12 z-50 w-[min(100vw-2rem,22rem)] border-border/60 shadow-elevated">
          <CardContent className="max-h-80 overflow-y-auto p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace notifications
            </p>
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={`w-full rounded-lg border border-border/60 p-2.5 text-left text-sm transition hover:bg-secondary/50 ${notification.readAt ? "opacity-70" : ""}`}
                      onClick={() => onNotificationClick(notification)}
                    >
                      <p className="font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
