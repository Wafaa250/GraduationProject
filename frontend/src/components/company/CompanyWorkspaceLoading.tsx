import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  message?: string;
  className?: string;
};

/** Inline loading state for cards and panels. */
export function CompanyWorkspaceLoading({
  message = "Loading…",
  className,
}: Props) {
  return (
    <div className={cn("cw-workspace-loading", className)} role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm cw-text-secondary">{message}</p>
    </div>
  );
}
