import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  analyzeHref: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function CompanyRequestAnalyzeCta({
  analyzeHref,
  disabled = false,
  disabledReason,
}: Props) {
  return (
    <div className="cw-request-review-ai-banner rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="cw-request-review-ai-icon shrink-0">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">
              View AI recommendations
            </p>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              See ranked students or teams with explainable match scores, then contact them
              directly outside SkillSwap.
            </p>
          </div>
        </div>
        {disabled ? (
          <Button
            size="sm"
            className="rounded-xl shrink-0 bg-white/15 text-white border border-white/25 hover:bg-white/15"
            disabled
            title={disabledReason}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            View AI recommendations
          </Button>
        ) : (
          <Button
            asChild
            size="sm"
            className="rounded-xl shrink-0 border-0 bg-white text-primary hover:bg-white/90 shadow-sm font-medium"
          >
            <Link to={analyzeHref}>
              <Sparkles className="h-4 w-4 mr-1" />
              View AI recommendations
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
