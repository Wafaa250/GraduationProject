import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentMessagesEmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function StudentMessagesEmptyState({
  title,
  description,
  className,
}: StudentMessagesEmptyStateProps) {
  return (
    <div className={cn("student-messages-empty", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <MessageCircle className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
