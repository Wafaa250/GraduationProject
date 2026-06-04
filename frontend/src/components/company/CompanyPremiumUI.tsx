import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Decorative mini bar chart from a numeric seed (presentation only). */
export function SparkBars({ seed, className }: { seed: number; className?: string }) {
  const bars = Array.from({ length: 7 }, (_, i) => {
    const h = 28 + ((seed * (i + 3) * 17) % 72);
    return h;
  });
  return (
    <div className={cn("cw-spark-bars", className)} aria-hidden>
      {bars.map((h, i) => (
        <span key={i} className="cw-spark-bar" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function LivePulse({ label = "Live" }: { label?: string }) {
  return (
    <span className="cw-live-pulse">
      <span className="cw-live-pulse-dot" aria-hidden />
      {label}
    </span>
  );
}

type LuxStatProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  hint?: string;
  accent?: "default" | "ai" | "success";
  delay?: number;
  /** No spark chart, hint, or link arrow — metrics only */
  simple?: boolean;
};

export function CompanyLuxStat({
  label,
  value,
  icon: Icon,
  href,
  hint,
  accent = "default",
  delay = 0,
  simple = false,
}: LuxStatProps) {
  const numeric = typeof value === "number" ? value : 0;
  const inner = (
    <div
      className={cn(
        "cw-lux-stat",
        accent !== "default" && `cw-lux-stat--${accent}`,
        simple && "cw-lux-stat--simple",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="cw-lux-stat-top">
        <span className="cw-lux-stat-icon">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        {simple ? null : <SparkBars seed={numeric} />}
      </div>
      <div className="cw-lux-stat-value">{value}</div>
      <div className="cw-lux-stat-label">{label}</div>
      {!simple && hint ? <p className="cw-lux-stat-hint">{hint}</p> : null}
      {!simple && href ? <ArrowUpRight className="cw-lux-stat-arrow h-4 w-4" /> : null}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {inner}
      </Link>
    );
  }
  return inner;
}

type HeroProps = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  description?: string;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  showLivePulse?: boolean;
};

export function CompanyLuxHero({
  eyebrow,
  title,
  subtitle,
  description,
  footer,
  actions,
  aside,
  className,
  showLivePulse = false,
}: HeroProps) {
  return (
    <section className={cn("cw-lux-hero", className)}>
      <div className="cw-lux-hero-mesh" aria-hidden />
      <div className="cw-lux-hero-grid" aria-hidden />
      <div className="relative cw-lux-hero-inner">
        <div className="flex flex-col xl:flex-row xl:items-stretch gap-8">
          <div className="flex-1 min-w-0 space-y-4">
            {eyebrow || actions ? (
              <div className="cw-lux-hero-toolbar">
                <div className="cw-lux-hero-toolbar-start">
                  {eyebrow ? <p className="cw-lux-eyebrow">{eyebrow}</p> : null}
                  {showLivePulse ? <LivePulse /> : null}
                </div>
                {actions ? (
                  <div className="cw-lux-hero-toolbar-actions">{actions}</div>
                ) : null}
              </div>
            ) : null}
            <h1 className="cw-lux-hero-title">{title}</h1>
            {subtitle ? (
              <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
            ) : null}
            {description ? <p className="cw-lux-hero-desc">{description}</p> : null}
            {footer ? <div className="cw-lux-hero-footer">{footer}</div> : null}
          </div>
          {aside ? <div className="shrink-0 xl:w-[280px]">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function CompanyHiringScore({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (clamped / 100) * circumference;
  let label = "Getting started";
  if (clamped >= 75) label = "Strong pipeline";
  else if (clamped >= 50) label = "Building momentum";
  else if (clamped >= 25) label = "Early stage";

  return (
    <div className="cw-hiring-score">
      <div className="cw-hiring-score-ring-wrap">
        <svg className="cw-hiring-score-svg" viewBox="0 0 100 100" aria-hidden>
          <circle className="cw-hiring-score-track" cx="50" cy="50" r="42" />
          <circle
            className="cw-hiring-score-fill"
            cx="50"
            cy="50"
            r="42"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="cw-hiring-score-center">
          <span className="cw-hiring-score-num">{clamped}</span>
          <span className="cw-hiring-score-unit">/ 100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xs font-semibold text-foreground">Hiring health</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

type PanelProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "accent";
};

export function CompanyLuxPanel({
  title,
  description,
  action,
  children,
  className,
  variant = "default",
}: PanelProps) {
  return (
    <div className={cn("cw-lux-panel", variant !== "default" && `cw-lux-panel--${variant}`, className)}>
      <div className="cw-lux-panel-head">
        <div className="min-w-0">
          <h2 className="cw-lux-panel-title">{title}</h2>
          {description ? <p className="cw-lux-panel-desc">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="cw-lux-panel-body">{children}</div>
    </div>
  );
}

export function PipelineProgress({ savedStudents, savedTeams }: { savedStudents: number; savedTeams: number }) {
  const total = savedStudents + savedTeams;
  const pct = Math.min(100, total * 12);
  return (
    <div className="cw-pipeline-progress mt-2.5" title={`${total} saved`}>
      <div className="cw-pipeline-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AiCtaStrip({
  title,
  description,
  to,
  label = "Launch AI matching",
}: {
  title: string;
  description: string;
  to: string;
  label?: string;
}) {
  return (
    <div className="cw-ai-cta-strip">
      <div className="cw-ai-cta-strip-glow" aria-hidden />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="cw-ai-cta-icon">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-sm tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        <Button asChild size="sm" className="cw-btn-gradient rounded-lg h-9 shrink-0 border-0">
          <Link to={to}>
            {label}
            <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
