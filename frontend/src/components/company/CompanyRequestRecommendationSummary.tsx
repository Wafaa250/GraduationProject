import { Sparkles } from "lucide-react";
import type { CompanyProjectRequestDetail } from "@/api/companyApi";
import {
  getRequestProjectTitle,
  getRequestRoleSubtitle,
} from "@/lib/companyRequestDisplay";
import { CompanyRequestMetaTags } from "@/components/company/CompanyRequestMetaTags";

type Props = {
  request: CompanyProjectRequestDetail;
  variant?: "individual" | "team";
};

export function CompanyRequestRecommendationSummary({ request, variant = "individual" }: Props) {
  const projectTitle = getRequestProjectTitle(request);
  const roleSubtitle = getRequestRoleSubtitle(request);
  const isTeam = variant === "team";

  const description = isTeam
    ? "AI-built teams ranked for role coverage, team chemistry, and alignment with your project goals."
    : "AI-ranked students based on your roles, skills, technologies, and project goals.";

  return (
    <div className="cw-request-summary-lux mb-6">
      <div className="cw-lux-hero-mesh absolute inset-0 opacity-60 rounded-[inherit]" aria-hidden />
      <div className="relative flex gap-4 items-start p-5 md:p-6">
        <div className="cw-ai-cta-icon shrink-0 h-11 w-11 rounded-xl">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="cw-lux-eyebrow">Request summary</p>
          <h2 className="text-xl md:text-2xl font-semibold mt-2 tracking-tight leading-snug">
            {projectTitle}
          </h2>
          {roleSubtitle ? (
            <p className="text-sm md:text-base mt-1.5 text-muted-foreground font-medium">{roleSubtitle}</p>
          ) : null}
          <p className="text-sm mt-3 text-muted-foreground leading-relaxed max-w-3xl">{description}</p>
          <CompanyRequestMetaTags request={request} showAllSkills={!isTeam} className="mt-4" />
        </div>
      </div>
    </div>
  );
}
