import type { LucideIcon } from "lucide-react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type DoctorMessagesEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  variant?: "compact" | "hero";
};

export function DoctorMessagesEmptyState({
  icon: Icon = MessageSquare,
  title,
  description,
  variant = "compact",
}: DoctorMessagesEmptyStateProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "doctor-messages-empty",
        isHero && "doctor-messages-empty--hero",
      )}
    >
      <div
        className={cn(
          "doctor-messages-empty__art",
          isHero && "doctor-messages-empty__art--hero",
        )}
        aria-hidden
      >
        <div className="doctor-messages-empty__ring doctor-messages-empty__ring--outer" />
        <div className="doctor-messages-empty__ring" />
        <div className="doctor-messages-empty__icon-wrap">
          <Icon className={cn(isHero ? "h-8 w-8" : "h-6 w-6")} />
        </div>
      </div>
      <p className="doctor-messages-empty__title">{title}</p>
      <p className="doctor-messages-empty__desc">{description}</p>
    </div>
  );
}
