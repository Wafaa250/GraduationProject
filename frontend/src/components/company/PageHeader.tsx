import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function CompanyPageHeader({ title, subtitle, eyebrow, actions, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-0.5",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <p className="cw-page-eyebrow">{eyebrow}</p> : null}
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
