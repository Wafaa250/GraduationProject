import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../ui/utils";

type AIRecommendationCardProps = {
  title: string;
  reason?: string;
  children?: ReactNode;
  className?: string;
};

export function AIRecommendationCard({
  title,
  reason,
  children,
  className,
}: AIRecommendationCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-ai/20 bg-ai-soft/60 p-4 shadow-soft",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-ai opacity-20 blur-2xl"
      />
      <div className="relative flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-ai text-ai-foreground shadow-ai">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ai">Why this match</p>
          <p className="mt-1 font-display font-semibold text-foreground">{title}</p>
          {reason ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reason}</p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
