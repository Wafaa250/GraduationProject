import { RefreshCcw, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  teamCount: number;
  regenerating: boolean;
  onRegenerate: () => void;
};

export function CompanyTeamRecommendationsToolbar({
  teamCount,
  regenerating,
  onRegenerate,
}: Props) {
  return (
    <div className="cw-lux-panel mb-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <p className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 shrink-0 text-[hsl(var(--cw-accent))]" />
          <span>
            <span className="font-semibold text-foreground tabular-nums">{teamCount}</span>{" "}
            {teamCount === 1 ? "suggested team" : "suggested teams"}
          </span>
          <span className="hidden sm:inline text-muted-foreground/80">·</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--cw-accent))] shrink-0" />
            AI-matched for your roles
          </span>
        </p>
        <Button
          variant="outline"
          className="rounded-lg shrink-0 h-9"
          onClick={onRegenerate}
          disabled={regenerating}
        >
          <RefreshCcw className={`h-4 w-4 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Refreshing…" : "Refresh teams"}
        </Button>
      </div>
    </div>
  );
}
