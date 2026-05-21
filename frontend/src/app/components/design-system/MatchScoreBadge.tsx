import { Sparkles } from "lucide-react";

import { cn } from "../ui/utils";

export function MatchScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 90
      ? "from-ai to-primary"
      : score >= 80
        ? "from-primary to-accent"
        : "from-accent to-primary";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r p-px shadow-sm",
        tone,
        className,
      )}
    >
      <div className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-semibold">
        <Sparkles className="h-3 w-3 shrink-0 text-ai" />
        <span className="gradient-text-ai">{score}% match</span>
      </div>
    </div>
  );
}
