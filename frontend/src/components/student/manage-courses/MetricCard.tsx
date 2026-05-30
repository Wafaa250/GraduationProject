import { cn } from "@/components/ui/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "success" | "warning";

const toneMap: Record<Tone, { ring: string; iconBg: string; iconFg: string; trend: string }> = {
  primary: { ring: "ring-primary/10", iconBg: "bg-primary-soft", iconFg: "text-primary", trend: "text-primary" },
  info: { ring: "ring-info/10", iconBg: "bg-info-soft", iconFg: "text-info", trend: "text-info" },
  success: { ring: "ring-success/10", iconBg: "bg-success-soft", iconFg: "text-success", trend: "text-success" },
  warning: { ring: "ring-warning/10", iconBg: "bg-warning-soft", iconFg: "text-warning", trend: "text-warning" },
};

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
};

export function MetricCard({ label, value, hint, icon: Icon, tone = "primary" }: MetricCardProps) {
  const t = toneMap[tone];
  return (
    <div
      className={cn(
        "group relative bg-gradient-card border border-border rounded-2xl p-5 shadow-card hover:shadow-elevated transition-smooth",
        "ring-1",
        t.ring,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground font-medium">{label}</div>
          <div className="mt-2 text-3xl font-display font-bold tracking-tight">{value}</div>
          {hint ? <div className={cn("mt-1.5 text-xs font-medium", t.trend)}>{hint}</div> : null}
        </div>
        <div className={cn("h-11 w-11 rounded-xl grid place-items-center shrink-0", t.iconBg)}>
          <Icon className={cn("h-5 w-5", t.iconFg)} />
        </div>
      </div>
    </div>
  );
}
