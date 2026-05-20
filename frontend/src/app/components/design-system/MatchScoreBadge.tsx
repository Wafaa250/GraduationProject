import { Sparkles } from "lucide-react";

import { cn } from "../ui/utils";

export function MatchScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-ai/20 bg-ai-soft px-2.5 py-1 text-xs font-semibold text-ai",
        className,
      )}
    >
      <Sparkles className="h-3 w-3 shrink-0" />
      <span>{score}% match</span>
    </div>
  );
}
