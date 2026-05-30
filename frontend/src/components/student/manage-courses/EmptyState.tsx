import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "primary" | "info" | "success" | "warning";
  className?: string;
};

const toneMap = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
} as const;

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "primary",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-gradient-soft/40 p-10 md:p-14 text-center",
        className,
      )}
    >
      <div className="mx-auto relative w-20 h-20">
        <div
          className={cn("absolute inset-0 rounded-3xl rotate-6", toneMap[tone], "opacity-60 blur-sm")}
          aria-hidden
        />
        <div className={cn("relative h-20 w-20 rounded-3xl grid place-items-center", toneMap[tone])}>
          <Icon className="h-9 w-9" />
        </div>
      </div>
      <h3 className="mt-6 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    </div>
  );
}
