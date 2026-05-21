import type { GraduationNotificationDto } from "../../../api/notificationsApi";
import { cn } from "../ui/utils";
import { formatNotificationTime } from "./notificationPresentation";
import { NotificationIconBadge } from "./NotificationIconBadge";

type Props = {
  notification: GraduationNotificationDto;
  onClick?: () => void;
  className?: string;
};

/** Compact row for the header notification dropdown (Figma layout). */
export function NotificationDropdownRow({ notification, onClick, className }: Props) {
  const content = (
    <>
      <NotificationIconBadge notification={notification} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-foreground">{notification.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full gap-3 border-b border-border p-3 text-left transition-colors last:border-b-0 hover:bg-muted/40",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn("flex gap-3 border-b border-border p-3 last:border-b-0", className)}>
      {content}
    </div>
  );
}
