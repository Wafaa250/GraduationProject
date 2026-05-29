import { Link } from "react-router-dom";
import { Sparkles, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import type { CompanyRequestTeamRecommendationMember } from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  member: CompanyRequestTeamRecommendationMember;
  requestId: number;
  teamId: number;
};

export function CompanyTeamMemberDiscoveryCard({ member, requestId, teamId }: Props) {
  const subtitle = [member.major || member.faculty, member.university].filter(Boolean).join(" · ");
  const explanation =
    member.assignmentReason?.trim() ||
    (member.highlights.length > 0 ? member.highlights[0] : "");

  return (
    <Card className="cw-card-elevated h-full border border-border/50">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="cw-candidate-avatar-fallback text-sm font-medium">
              {initials(member.studentName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Badge
              variant="outline"
              className="rounded-md text-[10px] font-normal border-primary/25 text-primary mb-1.5"
            >
              {member.roleName}
            </Badge>
            <h3 className="font-semibold text-base leading-tight truncate">{member.studentName}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <CompatibilityRing value={member.roleScore} size={48} />
        </div>

        {explanation && (
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex-1">
            <p className="text-[11px] font-medium text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
              Role fit
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-4">
              {explanation}
            </p>
          </div>
        )}

        <Button
          asChild
          size="sm"
          className="mt-4 rounded-xl cw-btn-gradient border-0 shadow-sm w-full"
        >
          <Link
            to={COMPANY_ROUTES.studentDiscoveryProfile(
              requestId,
              member.studentProfileId,
              teamId,
            )}
          >
            <UserRound className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            View full profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
