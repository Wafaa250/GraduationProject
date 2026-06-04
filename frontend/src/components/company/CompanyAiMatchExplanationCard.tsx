import { Sparkles } from "lucide-react";
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
    <section className="cw-lux-section cw-match-explanation-lux">
      <div className="cw-lux-section-head">
        <span className="cw-ai-cta-icon h-9 w-9 rounded-lg shrink-0">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="cw-lux-section-title">AI match explanation</h2>
      </div>
      <div className="cw-lux-section-body space-y-5 text-sm">
        {summary ? (
          <div>
            <p className="cw-section-label mb-2">AI match summary</p>
            <p className="text-muted-foreground leading-relaxed">{summary}</p>
          </div>
        ) : null}

        {keyReasons.length > 0 ? (
          <div>
            <p className="cw-section-label mb-2">Key match reasons</p>
            <ul className="space-y-2.5">
              {keyReasons.map((line) => (
                <li key={line} className="flex gap-2.5 text-muted-foreground leading-snug">
                  <span className="text-[hsl(var(--cw-accent))] shrink-0 font-bold">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {suggestedRole ? (
          <div className="pt-4 border-t border-border/50">
            <p className="cw-section-label mb-1.5">Suggested role for your request</p>
            <p className="font-semibold text-[hsl(var(--cw-accent))] text-lg leading-tight">
              {suggestedRole}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
