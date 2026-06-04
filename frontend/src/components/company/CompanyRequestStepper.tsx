import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  steps: readonly string[];
  current: number;
  className?: string;
};

export function CompanyRequestStepper({ steps, current, className }: Props) {
  return (
    <nav
      className={cn(
        "cw-request-stepper cw-wizard-stepper flex w-full min-w-0 items-center justify-between gap-1 overflow-x-auto",
        className,
      )}
      aria-label="Request creation progress"
    >
      {steps.map((label, i) => {
        const isComplete = i < current;
        const isActive = i === current;
        const isPending = i > current;

        return (
          <div key={label} className="flex items-center shrink-0">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-1 py-0.5 transition-colors",
                isActive && "bg-[hsl(var(--cw-accent-muted))]",
              )}
            >
              <div
                className={cn(
                  "cw-request-step-indicator",
                  isComplete && "is-complete",
                  isActive && "is-active",
                  isPending && "is-pending",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : isComplete
                      ? "text-muted-foreground hidden md:inline"
                      : "text-muted-foreground/70 hidden lg:inline",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "cw-request-step-connector mx-1",
                  isComplete && "is-complete",
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
