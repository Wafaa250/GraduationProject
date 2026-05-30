import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: LucideIcon;
  className?: string;
};

/** Error state for failed page/panel loads. */
export function CompanyWorkspaceErrorState({
  message,
  onRetry,
  retryLabel = "Retry",
  icon: Icon = AlertCircle,
  className,
}: Props) {
  return (
    <div className={cn("cw-empty-state py-10", className)}>
      <div className="cw-empty-state-icon">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="cw-empty-state-title">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5 rounded-xl cw-btn-outline"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
