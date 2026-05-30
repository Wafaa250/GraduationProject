import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface WorkspaceCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}

export function WorkspaceCard({
  icon,
  title,
  description,
  badge,
  children,
  className,
}: WorkspaceCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-elev-sm hover:shadow-elev-md transition-shadow duration-300",
        className,
      )}
    >
      <header className="flex items-start gap-3 px-6 pt-6 pb-4">
        {icon && (
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-accent text-accent-foreground shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[17px] font-semibold text-foreground leading-tight">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      </header>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}
