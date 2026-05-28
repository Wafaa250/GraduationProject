import type { LucideIcon } from "lucide-react";
import { MessageSquare } from "lucide-react";

type DoctorMessagesEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
};

export function DoctorMessagesEmptyState({
  icon: Icon = MessageSquare,
  title,
  description,
}: DoctorMessagesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
