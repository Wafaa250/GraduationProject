import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CompanyProjectRequestDetail } from "@/api/companyApi";
import {
  getRequestProjectTitle,
  getRequestRoleLabels,
  getRequestRoleSubtitle,
  getRequestSkillLabels,
} from "@/lib/companyRequestDisplay";
import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";

type Props = {
  request: CompanyProjectRequestDetail;
  variant?: "individual" | "team" | "detail";
};

export function CompanyRequestRecommendationSummary({ request, variant = "individual" }: Props) {
  const skills = getRequestSkillLabels(request);
  const roles = getRequestRoleLabels(request);
  const projectTitle = getRequestProjectTitle(request);
  const roleSubtitle = getRequestRoleSubtitle(request);
  const formatLabel = collaborationFormatLabel(request.collaborationType) || "—";
  const isTeam = variant === "team";
  const isDetail = variant === "detail";

  const description = isDetail
    ? request.description?.trim() || "No description provided."
    : isTeam
      ? "AI-built teams ranked for role coverage, team chemistry, and alignment with your project goals."
      : "AI-ranked students based on your roles, skills, technologies, and project goals.";

  const bannerClass = isDetail ? "cw-detail-summary" : "cw-rec-summary-banner";
  const iconClass = isDetail ? "cw-detail-summary-icon" : "cw-rec-summary-icon";
  const chipClass = isDetail ? "cw-detail-chip" : "cw-rec-chip";
  const eyebrow = isDetail ? "Project request" : "Request summary";

  return (
    <div className={`${bannerClass} rounded-2xl p-5 md:p-6 mb-6`}>
      <div className="flex gap-3 items-start">
        <div className={`${iconClass} shrink-0`}>
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
            {eyebrow}
          </p>
          <h2 className="text-xl md:text-2xl font-semibold mt-1.5 tracking-tight leading-snug">
            {projectTitle}
          </h2>
          {roleSubtitle ? (
            <p className="text-sm md:text-base mt-1 opacity-95 font-medium">{roleSubtitle}</p>
          ) : null}
          <p className="text-sm mt-3 opacity-90 leading-relaxed max-w-3xl">{description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {request.category && (
              <Badge className={`${chipClass} rounded-md border-0 text-xs font-normal`}>
                {request.category}
              </Badge>
            )}
            {(isTeam || isDetail) && roles.length > 0 ? (
              <Badge className={`${chipClass} rounded-md border-0 text-xs font-normal`}>
                {roles.length} role{roles.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
            {formatLabel !== "—" && (
              <Badge className={`${chipClass} rounded-md border-0 text-xs font-normal`}>
                {formatLabel}
              </Badge>
            )}
            {(isTeam || isDetail ? skills.slice(0, 4) : skills).map((skill) => (
              <Badge key={skill} className={`${chipClass} rounded-md border-0 text-xs font-normal`}>
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
