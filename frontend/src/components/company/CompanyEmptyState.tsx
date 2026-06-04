import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Action = { label: string; to: string };

type Props = {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: Action;
  compact?: boolean;
  className?: string;
};

export function CompanyEmptyState({
  icon: Icon,
  title,
  message,
  action,
  compact = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "cw-empty-state flex flex-col items-center text-center",
        compact ? "cw-empty-state--compact" : undefined,
        className,
      )}
    >
      <div className={cn("cw-empty-state-icon", compact && "cw-empty-state-icon--sm")}>
        <Icon className={cn(compact ? "h-5 w-5" : "h-7 w-7")} aria-hidden />
      </div>
      {title ? (
        <h3 className="text-sm font-semibold tracking-tight text-foreground mt-4">{title}</h3>
      ) : null}
      <p
        className={cn(
          "text-sm text-muted-foreground max-w-sm leading-relaxed",
          title ? "mt-1.5" : "mt-4",
        )}
      >
        {message}
      </p>
      {action ? (
        <Button asChild variant="outline" size="sm" className="mt-5 rounded-lg h-9">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
