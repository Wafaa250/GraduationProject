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
  variant?: "individual" | "team";
};

export function CompanyRequestRecommendationSummary({ request, variant = "individual" }: Props) {
  const skills = getRequestSkillLabels(request);
  const roles = getRequestRoleLabels(request);
  const projectTitle = getRequestProjectTitle(request);
  const roleSubtitle = getRequestRoleSubtitle(request);
  const formatLabel = collaborationFormatLabel(request.collaborationType) || "—";
  const isTeam = variant === "team";

  const description = isTeam
    ? "AI-built teams ranked for role coverage, team chemistry, and alignment with your project goals."
    : "AI-ranked students based on your roles, skills, technologies, and project goals.";

  return (
    <div className="cw-rec-summary-banner rounded-2xl p-5 md:p-6 mb-6">
      <div className="flex gap-3 items-start">
        <div className="cw-rec-summary-icon shrink-0">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
            Request summary
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
              <Badge className="cw-rec-chip rounded-md border-0 text-xs font-normal">
                {request.category}
              </Badge>
            )}
            {isTeam && roles.length > 0 ? (
              <Badge className="cw-rec-chip rounded-md border-0 text-xs font-normal">
                {roles.length} roles
              </Badge>
            ) : null}
            {formatLabel !== "—" && (
              <Badge className="cw-rec-chip rounded-md border-0 text-xs font-normal">
                {formatLabel}
              </Badge>
            )}
            {(isTeam ? skills.slice(0, 4) : skills).map((skill) => (
              <Badge key={skill} className="cw-rec-chip rounded-md border-0 text-xs font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
