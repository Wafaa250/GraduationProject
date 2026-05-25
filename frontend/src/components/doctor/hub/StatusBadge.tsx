import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  new: "bg-primary/10 text-primary ring-1 ring-primary/20",
  reviewing: "bg-warning/15 text-warning ring-1 ring-warning/25",
  accepted: "bg-success/15 text-success ring-1 ring-success/25",
  "on-track": "bg-success/15 text-success ring-1 ring-success/25",
  review: "bg-warning/15 text-warning ring-1 ring-warning/25",
  risk: "bg-danger/15 text-danger ring-1 ring-danger/25",
};

const labels: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  accepted: "Accepted",
  "on-track": "On Track",
  review: "Needs Review",
  risk: "At Risk",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        styles[status] || styles.new,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  );
}
