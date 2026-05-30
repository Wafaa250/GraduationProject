import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GraduationNotification } from "@/api/notificationsApi";
import { getNotificationVisual } from "@/lib/notificationPresentation";
import { formatDoctorHubRelativeTime } from "@/lib/doctorHubMappers";

type NotificationCenterProps = {
  unreadCount: number;
  open: boolean;
  onToggle: () => void;
  notifications: GraduationNotification[];
  loading: boolean;
  markingAllRead: boolean;
  onMarkAllRead: () => void;
  onNotificationClick: (n: GraduationNotification) => void;
  getTargetLabel?: (n: GraduationNotification) => string | null;
  variant?: "doctor" | "student";
  className?: string;
};

export function NotificationBellButton({
  unreadCount,
  open,
  onToggle,
  variant = "doctor",
  className,
}: Pick<NotificationCenterProps, "unreadCount" | "open" | "onToggle" | "variant" | "className">) {
  if (variant === "student") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("relative h-9 w-9 rounded-lg", className)}
        aria-expanded={open}
        aria-label="Notifications"
        onClick={onToggle}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-smooth hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        className,
      )}
      aria-expanded={open}
      aria-label="Notifications"
      onClick={onToggle}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export function NotificationCenterDropdown({
  open,
  unreadCount,
  notifications,
  loading,
  markingAllRead,
  onMarkAllRead,
  onNotificationClick,
  getTargetLabel,
  variant = "doctor",
}: Omit<NotificationCenterProps, "onToggle">) {
  if (!open) return null;

  const cardClass =
    variant === "student"
      ? "absolute right-0 top-11 z-50 w-[min(100vw-2rem,22rem)] border-border/60 shadow-elevated"
      : "absolute right-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,22rem)] border-border/70 shadow-elevated";

  return (
    <Card className={cardClass}>
      <CardContent className="flex max-h-96 flex-col p-0 bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1.5 normal-case text-primary">({unreadCount} unread)</span>
            )}
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
              disabled={markingAllRead}
              onClick={onMarkAllRead}
            >
              {markingAllRead ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {notifications.map((n) => {
                const isUnread = !n.readAt;
                const visual = getNotificationVisual(n);
                const Icon = visual.icon;
                const targetLabel = getTargetLabel?.(n);

                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        "notif-center-item w-full rounded-lg border p-2.5 text-left text-sm transition-smooth",
                        isUnread
                          ? "notif-center-item--unread border-primary/20 bg-primary/5"
                          : "border-border/60 opacity-85 hover:bg-secondary/50",
                      )}
                      onClick={() => onNotificationClick(n)}
                    >
                      <div className="flex gap-2.5">
                        <span
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                            visual.bgClass,
                            visual.accentClass,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-foreground leading-tight">{n.title}</p>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {formatDoctorHubRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                          {targetLabel ? (
                            <p className="mt-1 text-[10px] font-medium text-primary">{targetLabel}</p>
                          ) : null}
                        </div>
                        {isUnread ? (
                          <span
                            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
