import { cn } from "@/lib/utils";

type Props = {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function CompanyMatchScoreBadge({ score, size = "md", className }: Props) {
  const dims =
    size === "lg"
      ? "h-16 w-16 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-[11px]"
        : "h-12 w-12 text-sm";
  const ring = `conic-gradient(hsl(var(--primary)) ${score * 3.6}deg, hsl(var(--muted)) 0deg)`;

  return (
    <div
      className={cn("relative rounded-full flex items-center justify-center shrink-0", dims, className)}
      style={{ background: ring }}
      aria-label={`${score}% match`}
    >
      <div className="absolute inset-[3px] rounded-full bg-card flex items-center justify-center">
        <div className="flex flex-col items-center leading-none">
          <span className="font-semibold cw-gradient-text tabular-nums">{score}</span>
          {size !== "sm" && (
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">
              match
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
