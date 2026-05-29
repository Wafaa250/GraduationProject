import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CompanyProjectRequestDetail } from "@/api/companyApi";
import {
  getRequestRoleLabels,
  getRequestSkillLabels,
} from "@/lib/companyRequestDisplay";
import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";

type Props = {
  request: CompanyProjectRequestDetail;
  variant?: "individual" | "team";
};

export function CompanyRequestRecommendationSummary({ request, variant = "individual" }: Props) {
  const roles = getRequestRoleLabels(request);
  const skills = getRequestSkillLabels(request);
  const roleLabel = roles.length > 0 ? roles.join(" · ") : "—";
  const formatLabel = collaborationFormatLabel(request.collaborationType) || "—";
  const isTeam = variant === "team";

  if (isTeam) {
    return (
      <div className="cw-rec-summary-banner rounded-2xl px-5 py-4 mb-5">
        <div className="flex gap-3 items-center min-w-0">
          <div className="cw-rec-summary-icon shrink-0 h-9 w-9">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight truncate">{request.title}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge className="cw-rec-chip rounded-md border-0 text-[11px] font-normal">
                {roles.length} roles
              </Badge>
              {formatLabel !== "—" && (
                <Badge className="cw-rec-chip rounded-md border-0 text-[11px] font-normal">
                  {formatLabel}
                </Badge>
              )}
              {skills.slice(0, 4).map((skill) => (
                <Badge key={skill} className="cw-rec-chip rounded-md border-0 text-[11px] font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cw-rec-summary-banner rounded-2xl p-5 md:p-6 mb-6">
      <div className="flex gap-3 items-start">
        <div className="cw-rec-summary-icon shrink-0">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide font-semibold opacity-90">Request summary</p>
          <h2 className="text-lg md:text-xl font-semibold mt-1 tracking-tight truncate">
            {request.title}
          </h2>
          <p className="text-sm mt-2 opacity-90 leading-relaxed max-w-3xl">
            Suggested candidates related to your requested role, skills, and collaboration preferences.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {request.category && (
              <Badge className="cw-rec-chip rounded-md border-0 text-xs font-normal">
                {request.category}
              </Badge>
            )}
            <Badge className="cw-rec-chip rounded-md border-0 text-xs font-normal">
              Role: {roleLabel}
            </Badge>
            {formatLabel !== "—" && (
              <Badge className="cw-rec-chip rounded-md border-0 text-xs font-normal">
                {formatLabel}
              </Badge>
            )}
            {skills.map((skill) => (
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
