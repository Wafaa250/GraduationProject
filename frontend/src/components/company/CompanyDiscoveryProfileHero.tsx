import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyMatchScoreBadge } from "@/components/company/CompanyMatchScoreBadge";
import { cn } from "@/lib/utils";

type Stat = { label: string; value: string };

type Props = {
  backTo: string;
  backLabel: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  visual: ReactNode;
  actions?: ReactNode;
  score?: number;
  stats?: Stat[];
  footer?: ReactNode;
  className?: string;
};

export function CompanyDiscoveryProfileHero({
  backTo,
  backLabel,
  eyebrow,
  title,
  subtitle,
  meta,
  visual,
  actions,
  score,
  stats,
  footer,
  className,
}: Props) {
  return (
    <div className={cn("cw-discovery-hero mb-6", className)}>
      <div className="cw-lux-hero-mesh absolute inset-0 rounded-[inherit] opacity-70" aria-hidden />
      <div className="cw-lux-hero-grid absolute inset-0 rounded-[inherit] opacity-30" aria-hidden />

      <div className="relative p-5 md:p-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 h-8 rounded-lg text-muted-foreground">
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {backLabel}
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row md:items-end gap-5">
          <div className="shrink-0 -mt-2 md:-mt-4">{visual}</div>
          <div className="flex-1 min-w-0 md:pb-1">
            {eyebrow ? <p className="cw-lux-eyebrow">{eyebrow}</p> : null}
            <h1 className="text-2xl md:text-[1.65rem] font-semibold tracking-tight leading-tight mt-1">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p>
            ) : null}
            {meta ? <div className="mt-3">{meta}</div> : null}
          </div>
          {score != null && score > 0 ? (
            <div className="shrink-0 md:pb-1">
              <CompanyMatchScoreBadge score={score} size="lg" />
            </div>
          ) : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
            {stats.map((s) => (
              <div key={s.label} className="cw-discovery-stat-pill">
                <span className="cw-discovery-stat-pill-label">{s.label}</span>
                <span className="cw-discovery-stat-pill-value">{s.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        {footer ? <div className="mt-5 pt-5 border-t border-border/50">{footer}</div> : null}

        {actions ? <div className="flex flex-wrap gap-2 mt-5">{actions}</div> : null}
      </div>
    </div>
  );
}
