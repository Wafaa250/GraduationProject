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
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="cw-page-meta">
        <p className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium text-foreground">{teamCount}</span>{" "}
            {teamCount === 1 ? "suggested team" : "suggested teams"}
          </span>
          <span className="hidden sm:inline text-muted-foreground/80">·</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            AI-matched for your roles
          </span>
        </p>
      </div>
      <Button
        variant="outline"
        className="rounded-xl shrink-0 cw-btn-outline-primary"
        onClick={onRegenerate}
        disabled={regenerating}
      >
        <RefreshCcw className={`h-4 w-4 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
        {regenerating ? "Refreshing…" : "Refresh teams"}
      </Button>
    </div>
  );
}
