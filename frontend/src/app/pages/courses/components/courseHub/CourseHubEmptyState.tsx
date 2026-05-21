import type { ReactNode } from "react";

import { cn } from "../../../../components/ui/utils";

export function CourseHubEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-gradient-soft px-6 py-14 text-center",
        className,
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary shadow-card">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
