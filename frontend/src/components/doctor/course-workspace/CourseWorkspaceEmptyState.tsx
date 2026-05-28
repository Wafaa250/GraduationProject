import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CourseWorkspaceEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

export function CourseWorkspaceEmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: CourseWorkspaceEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-gradient-soft text-center shadow-card",
        compact ? "px-6 py-10" : "px-8 py-16",
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
