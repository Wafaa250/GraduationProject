import { Badge } from "@/components/ui/badge";
import type { CompanyProjectRequestDetail } from "@/api/companyApi";
import { getRequestRoleLabels, getRequestSkillLabels } from "@/lib/companyRequestDisplay";
import { collaborationFormatLabel } from "@/constants/companyRequestCatalog";
import { cn } from "@/lib/utils";

type Props = {
  request: CompanyProjectRequestDetail;
  /** Show every skill (recommendations summary); cap team skills when false */
  showAllSkills?: boolean;
  /** Detail page keeps skills in Requirements panel only */
  showSkills?: boolean;
  className?: string;
};

export function CompanyRequestMetaTags({
  request,
  showAllSkills = true,
  showSkills = true,
  className,
}: Props) {
  const skills = getRequestSkillLabels(request);
  const roles = getRequestRoleLabels(request);
  const formatLabel = collaborationFormatLabel(request.collaborationType) || "—";
  const isTeam = request.requestType === "ai-built-team";
  const visibleSkills = showSkills
    ? showAllSkills || !isTeam
      ? skills
      : skills.slice(0, 4)
    : [];

  const hasTags =
    request.category ||
    (isTeam && roles.length > 0) ||
    formatLabel !== "—" ||
    visibleSkills.length > 0;

  if (!hasTags) return null;

  return (
    <div className={cn("cw-lux-hero-meta flex flex-wrap gap-2", className)}>
      {request.category ? (
        <Badge variant="secondary" className="rounded-md text-xs font-normal">
          {request.category}
        </Badge>
      ) : null}
      {isTeam && roles.length > 0 ? (
        <Badge variant="secondary" className="rounded-md text-xs font-normal">
          {roles.length} role{roles.length === 1 ? "" : "s"}
        </Badge>
      ) : null}
      {!isTeam && roles.length > 0 ? (
        <Badge variant="secondary" className="rounded-md text-xs font-normal">
          {roles[0]}
        </Badge>
      ) : null}
      {formatLabel !== "—" ? (
        <Badge variant="outline" className="rounded-md text-xs font-normal">
          {formatLabel}
        </Badge>
      ) : null}
      {visibleSkills.map((skill) => (
        <Badge key={skill} variant="outline" className="rounded-md text-xs font-normal">
          {skill}
        </Badge>
      ))}
    </div>
  );
}
