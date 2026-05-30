import { cn } from "@/lib/utils";

type DoctorHubSectionEmptyProps = {
  message: string;
  className?: string;
  minHeight?: string;
};

/** Empty list/grid placeholder — preserves card chrome without demo content. */
export function DoctorHubSectionEmpty({
  message,
  className,
  minHeight = "min-h-[140px]",
}: DoctorHubSectionEmptyProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-doctor-accent/20 bg-doctor-accent-soft/40 px-6 py-10 flex items-center justify-center text-center shadow-card",
        minHeight,
        className,
      )}
    >
      <p className="text-[13px] text-muted-foreground max-w-sm">{message}</p>
    </div>
  );
}
