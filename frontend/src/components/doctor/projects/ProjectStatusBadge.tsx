import { cn } from "@/lib/utils";

export type ProjectHealthStatus = "active" | "completed";

const STATUS_STYLES: Record<ProjectHealthStatus, { label: string; className: string; dotClassName: string }> = {
  active: {
    label: "Supervised",
    className: "border-primary/20 bg-primary/10 text-primary",
    dotClassName: "bg-primary",
  },
  completed: {
    label: "Team complete",
    className: "border-success/20 bg-success/10 text-success",
    dotClassName: "bg-success",
  },
};

type ProjectStatusBadgeProps = {
  status: ProjectHealthStatus;
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const meta = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </span>
  );
}
