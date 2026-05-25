import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  steps: readonly string[];
  current: number;
  className?: string;
};

export function CompanyRequestStepper({ steps, current, className }: Props) {
  return (
    <div
      className={cn(
        "cw-request-stepper flex items-center gap-2 mb-8 overflow-x-auto pb-2",
        className,
      )}
      aria-label="Request creation progress"
    >
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              "cw-request-step-indicator",
              i < current && "is-complete",
              i === current && "is-active",
              i > current && "is-pending",
            )}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
          </div>
          <span
            className={cn(
              "text-xs whitespace-nowrap",
              i === current ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          {i < steps.length - 1 && <div className="cw-request-step-connector" aria-hidden />}
        </div>
      ))}
    </div>
  );
}
