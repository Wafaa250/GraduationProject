import { Sparkles } from "lucide-react";

export function CompanyRequestReviewAiBanner() {
  return (
    <div className="cw-request-review-ai-banner rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="cw-request-review-ai-icon shrink-0">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-medium leading-snug">
          AI will recommend matching students based on this request.
        </p>
      </div>
    </div>
  );
}
