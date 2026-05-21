import type { GraduationNotificationDto } from "../../../api/notificationsApi";
import { cn } from "../ui/utils";
import { formatNotificationTime } from "./notificationPresentation";
import { NotificationIconBadge } from "./NotificationIconBadge";

type Props = {
  notification: GraduationNotificationDto;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
};

export function NotificationCard({ notification, onClick, className, compact }: Props) {
  const inner = (
    <>
      <NotificationIconBadge notification={notification} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display font-semibold text-foreground">{notification.title}</p>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
      </div>
    </>
  );

  const baseClass = cn(
    "flex w-full gap-3 rounded-2xl border border-border bg-card text-left shadow-soft transition-shadow hover:shadow-pop",
    compact ? "p-3" : "p-4",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClass, "cursor-pointer font-inherit")}>
        {inner}
      </button>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}
