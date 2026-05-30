import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneMap: Record<
  string,
  { card: string; iconWell: string }
> = {
  primary: { card: "doctor-stat-card--indigo", iconWell: "" },
  info: { card: "doctor-stat-card--info", iconWell: "" },
  accent: { card: "doctor-stat-card--indigo", iconWell: "" },
  success: { card: "doctor-stat-card--success", iconWell: "doctor-icon-well--success" },
  warning: { card: "doctor-stat-card--warning", iconWell: "doctor-icon-well--warning" },
  danger: { card: "doctor-stat-card--danger", iconWell: "doctor-icon-well--danger" },
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
  empty?: boolean;
}) {
  const t = toneMap[tone] ?? toneMap.primary;
  const useIndigoWell = tone === "primary" || tone === "info" || tone === "accent";

  return (
    <div className={cn("doctor-stat-card group cursor-pointer", t.card)}>
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className={cn("doctor-icon-well shrink-0", !useIndigoWell && t.iconWell)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {empty || trend == null || trend === "" ? (
          <div className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md text-muted-foreground bg-card/80 border border-border/60">
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
            "font-display text-[30px] leading-none font-bold tracking-tight",
            empty && "text-muted-foreground",
            !empty && tone === "success" && "text-success",
            !empty && tone === "warning" && "text-warning",
            !empty && tone === "danger" && "text-danger",
            !empty && useIndigoWell && "text-doctor-accent",
          )}
        >
          {value}
        </div>
        <div className="mt-2 text-[13px] font-semibold text-foreground">{label}</div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
