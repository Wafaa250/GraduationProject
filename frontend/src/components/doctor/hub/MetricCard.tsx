import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneMap: Record<string, { bg: string; ic: string; ring: string }> = {
  primary: {
    bg: "from-primary/15 to-primary-glow/10",
    ic: "text-primary bg-primary/10",
    ring: "ring-primary/15",
  },
  info: { bg: "from-info/15 to-info/5", ic: "text-info bg-info/10", ring: "ring-info/15" },
  accent: { bg: "from-accent to-primary/5", ic: "text-primary bg-primary/10", ring: "ring-primary/15" },
  success: {
    bg: "from-success/15 to-success/5",
    ic: "text-success bg-success/10",
    ring: "ring-success/15",
  },
  warning: {
    bg: "from-warning/15 to-warning/5",
    ic: "text-warning bg-warning/10",
    ring: "ring-warning/15",
  },
  danger: { bg: "from-danger/15 to-danger/5", ic: "text-danger bg-danger/10", ring: "ring-danger/15" },
};

export function MetricCard({
  label,
  value,
  sub,
  trend,
  trendUp,
  tone = "primary",
  icon: Icon,
  empty = false,
}: {
  label: string;
  value: number | string;
  sub: string;
  trend?: string | null;
  trendUp?: boolean;
  tone?: keyof typeof toneMap;
  icon: LucideIcon;
  /** Hides trend chip and uses muted value styling when awaiting API data. */
  empty?: boolean;
}) {
  const t = toneMap[tone] ?? toneMap.primary;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-card hover:shadow-elevated transition-smooth cursor-pointer">
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl",
          t.bg,
        )}
      />
      <div className="relative flex items-start justify-between mb-3">
        <div className={cn("h-10 w-10 rounded-xl grid place-items-center ring-1", t.ic, t.ring)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {empty || trend == null || trend === "" ? (
          <div className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted">
            <Minus className="h-3 w-3" aria-hidden />
            <span className="sr-only">No trend data</span>
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
              trendUp ? "text-success bg-success/10" : "text-warning bg-warning/10",
            )}
          >
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="relative">
        <div
          className={cn(
            "font-display text-[28px] leading-none font-bold tracking-tight",
            empty ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {value}
        </div>
        <div className="mt-1.5 text-[13px] font-semibold text-foreground">{label}</div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
