import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAiMatchDisplay } from "@/lib/companyRecommendationDisplay";

type Props = {
  reasonSummary: string;
  highlights: string[];
  strengths: string[];
  alignedRoleName?: string | null;
  fallbackRole?: string | null;
};

export function CompanyAiMatchExplanationCard({
  reasonSummary,
  highlights,
  strengths,
  alignedRoleName,
  fallbackRole,
}: Props) {
  const { summary, keyReasons, suggestedRole } = buildAiMatchDisplay(
    { reasonSummary, highlights, strengths, alignedRoleName },
    fallbackRole,
  );

  if (!summary && keyReasons.length === 0 && !suggestedRole) {
    return null;
  }

  return (
    <Card className="cw-card-elevated border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg cw-btn-gradient grid place-items-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          AI match explanation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {summary && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              AI match summary
            </p>
            <p className="text-muted-foreground leading-relaxed">{summary}</p>
          </div>
        )}

        {keyReasons.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              Key match reasons
            </p>
            <ul className="space-y-2">
              {keyReasons.map((line) => (
                <li key={line} className="flex gap-2 text-muted-foreground leading-snug">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {suggestedRole && (
          <div className="pt-1 border-t border-border/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Suggested role for your request
            </p>
            <p className="font-semibold cw-gradient-text text-lg leading-tight">{suggestedRole}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
