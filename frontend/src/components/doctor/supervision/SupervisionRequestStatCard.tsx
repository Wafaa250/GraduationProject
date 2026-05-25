import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const accentTones: Record<string, { icon: string }> = {
  primary: { icon: "bg-primary/10 text-primary" },
  warning: { icon: "bg-warning/10 text-warning" },
  success: { icon: "bg-success/10 text-success" },
  destructive: { icon: "bg-destructive/10 text-destructive" },
};

type SupervisionRequestStatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: keyof typeof accentTones;
  loading?: boolean;
};

export function SupervisionRequestStatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  loading = false,
}: SupervisionRequestStatCardProps) {
  const tone = accentTones[accent] ?? accentTones.primary;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-card hover:shadow-elevated transition-smooth group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", tone.icon)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p
        className={cn(
          "font-display text-3xl font-bold tracking-tight",
          loading ? "text-muted-foreground animate-pulse" : "text-foreground",
        )}
      >
        {loading ? "…" : value}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
