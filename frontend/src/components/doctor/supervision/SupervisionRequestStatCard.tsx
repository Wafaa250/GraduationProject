import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const accentStyles: Record<
  string,
  { card: string; iconWell: string; valueClass: string }
> = {
  primary: {
    card: "doctor-stat-card--indigo",
    iconWell: "",
    valueClass: "text-doctor-accent",
  },
  warning: {
    card: "doctor-stat-card--warning",
    iconWell: "doctor-icon-well--warning",
    valueClass: "text-warning",
  },
  success: {
    card: "doctor-stat-card--success",
    iconWell: "doctor-icon-well--success",
    valueClass: "text-success",
  },
  destructive: {
    card: "doctor-stat-card--danger",
    iconWell: "doctor-icon-well--danger",
    valueClass: "text-danger",
  },
};

type SupervisionRequestStatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: keyof typeof accentStyles;
  loading?: boolean;
};

export function SupervisionRequestStatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  loading = false,
}: SupervisionRequestStatCardProps) {
  const style = accentStyles[accent] ?? accentStyles.primary;
  const useIndigoWell = accent === "primary";

  return (
    <div className={cn("doctor-stat-card", style.card)}>
      <div className="mb-4">
        <div className={cn("doctor-icon-well", !useIndigoWell && style.iconWell)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p
        className={cn(
          "font-display text-3xl font-bold tracking-tight",
          loading ? "text-muted-foreground animate-pulse" : style.valueClass,
        )}
      >
        {loading ? "…" : value}
      </p>
      <p className="text-sm font-medium text-foreground/80 mt-1.5">{label}</p>
    </div>
  );
}
