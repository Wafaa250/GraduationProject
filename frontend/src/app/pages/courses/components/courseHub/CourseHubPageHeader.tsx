import type { ReactNode } from "react";

import { cn } from "../../../../components/ui/utils";

export function CourseHubPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mb-8 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-70" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
