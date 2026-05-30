import { Link } from "react-router-dom";
import { AlertCircle, Pencil, RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  detailHref: string;
  regenerating: boolean;
  onRegenerate: () => void;
  onDismiss?: () => void;
};

export function CompanyTeamRecommendationsErrorState({
  detailHref,
  regenerating,
  onRegenerate,
}: Props) {
  return (
    <Card className="cw-card-elevated cw-team-state-panel overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-400/80 via-primary/70 to-accent/80" aria-hidden />
      <CardContent className="py-14 md:py-16 px-6 md:px-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="cw-team-state-icon cw-team-state-icon-warning mb-6 mx-auto">
            <Sparkles className="h-9 w-9" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            SkillSwap couldn&apos;t compose teams right now
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Our AI orchestration layer was unable to finish building team compositions for this request.
            Your request details are still saved — try the steps below before continuing backend tuning.
          </p>
          <div className="mt-8 rounded-xl border bg-secondary/30 text-left p-4 md:p-5 space-y-3 max-w-md mx-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Recommended next steps
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Regenerate teams to run a fresh orchestration pass.</li>
              <li>Relax or clarify role skills if requirements are very narrow.</li>
              <li>Confirm student profiles exist for each role discipline.</li>
              <li>Try again in a moment if the service was temporarily unavailable.</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button
              className="rounded-xl cw-btn-gradient shadow-sm border-0 min-w-[200px]"
              onClick={onRegenerate}
              disabled={regenerating}
            >
              <RefreshCcw className={`h-4 w-4 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating teams…" : "Try again"}
            </Button>
            <Button asChild variant="outline" className="rounded-xl min-w-[200px]">
              <Link to={detailHref}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit request
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
            If this continues, your company workspace and request summary remain available — only team
            generation needs to complete successfully.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
