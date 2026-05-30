import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Action = {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: "primary" | "outline";
};

type Step = {
  number: number;
  title: string;
  description: string;
};

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  eyebrow?: string;
  action?: Action;
  secondaryAction?: Action;
  steps?: Step[];
  /** Compact = inside a card panel (Dashboard-style). Full = standalone page empty. */
  compact?: boolean;
  className?: string;
};

function ActionButton({ action }: { action: Action }) {
  const className = cn(
    "rounded-xl min-w-[160px]",
    action.variant === "outline" ? "cw-btn-outline" : "cw-btn-gradient border-0 shadow-sm",
  );

  if (action.to) {
    return (
      <Button asChild size="sm" className={className}>
        <Link to={action.to}>{action.label}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" size="sm" className={className} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

/** Empty state — compact matches Dashboard card panels; full matches page-level empties. */
export function CompanyWorkspaceEmptyState({
  icon: Icon,
  title,
  description,
  eyebrow,
  action,
  secondaryAction,
  steps,
  compact = false,
  className,
}: Props) {
  return (
    <div className={cn("cw-empty-state", compact && "cw-empty-state--compact", className)}>
      <div className={compact ? "cw-empty-state-icon" : "cw-empty-state-icon--gradient mx-auto"}>
        <Icon className={compact ? "h-6 w-6" : "h-7 w-7"} aria-hidden />
      </div>
      {eyebrow ? (
        <p className="text-[10px] uppercase tracking-wider cw-section-label mt-4 mb-1">{eyebrow}</p>
      ) : null}
      <p className={cn("cw-empty-state-title", !compact && "text-lg")}>{title}</p>
      {description ? (
        <p className="text-sm cw-text-secondary max-w-md mx-auto mt-2 leading-relaxed">
          {description}
        </p>
      ) : null}
      {steps && steps.length > 0 ? (
        <ul className="mt-7 text-left text-sm cw-text-secondary space-y-3 max-w-md mx-auto">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-3 items-start">
              <span className="cw-empty-state-step">{step.number}</span>
              <span>
                <span className="text-foreground font-medium">{step.title}</span> {step.description}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          {action ? <ActionButton action={action} /> : null}
          {secondaryAction ? (
            <ActionButton action={{ ...secondaryAction, variant: "outline" }} />
          ) : null}
        </div>
      )}
    </div>
  );
}
