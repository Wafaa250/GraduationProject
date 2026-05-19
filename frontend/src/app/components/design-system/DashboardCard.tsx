import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../ui/utils";

export type DashboardCardAccent = "primary" | "ai" | "accent";

export type DashboardCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  accent?: DashboardCardAccent;
  badge?: string;
  className?: string;
};

const accentClasses: Record<DashboardCardAccent, string> = {
  primary: "bg-gradient-primary text-primary-foreground shadow-glow",
  ai: "bg-gradient-ai text-ai-foreground shadow-ai",
  accent: "bg-accent text-accent-foreground",
};

/** Lovable-style dashboard shortcut card; uses real `to` routes only. */
export function DashboardCard({
  icon: Icon,
  title,
  description,
  to,
  accent = "primary",
  badge,
  className,
}: DashboardCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            accentClasses[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {badge ? (
          <span className="rounded-full bg-ai-soft px-2 py-0.5 text-[11px] font-semibold text-ai">
            {badge}
          </span>
        ) : null}
      </div>
      <div>
        <h3 className="font-display font-semibold leading-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
