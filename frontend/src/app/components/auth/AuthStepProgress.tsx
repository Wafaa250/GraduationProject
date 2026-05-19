import { cn } from "../ui/utils";

export type AuthStepProgressProps = {
  steps: string[];
  /** Zero-based index of the active step */
  currentStep: number;
  className?: string;
};

export function AuthStepProgress({ steps, currentStep, className }: AuthStepProgressProps) {
  return (
    <div className={cn("mb-6 flex items-center gap-2 sm:mb-7", className)}>
      {steps.map((label, i) => (
        <div key={label} className="min-w-0 flex-1">
          <div
            className={cn(
              "h-1.5 rounded-full transition-colors",
              i <= currentStep ? "bg-gradient-primary" : "bg-muted",
            )}
          />
          <p
            className={cn(
              "mt-1.5 truncate text-[10px] font-semibold uppercase tracking-wider",
              i <= currentStep ? "text-primary" : "text-muted-foreground",
            )}
          >
            {String(i + 1).padStart(2, "0")} · {label}
          </p>
        </div>
      ))}
    </div>
  );
}
