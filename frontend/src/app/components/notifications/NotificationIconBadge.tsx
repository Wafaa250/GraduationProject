import type { GraduationNotificationDto } from "../../../api/notificationsApi";
import { cn } from "../ui/utils";
import { getNotificationPresentation } from "./notificationPresentation";

type Props = {
  notification: GraduationNotificationDto;
  size?: "sm" | "md";
  className?: string;
};

/** Filled circular badge with white Lucide icon (Lovable-style). */
export function NotificationIconBadge({ notification, size = "md", className }: Props) {
  const { Icon, tone } = getNotificationPresentation(notification);

  return (
    <div
      className={cn(
        "mt-0.5 shrink-0",
        size === "sm" ? "h-11 w-11" : "h-12 w-12",
        tone,
        className,
      )}
    >
      <Icon
        className={cn("text-white", size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5")}
        strokeWidth={2.25}
      />
    </div>
  );
}
