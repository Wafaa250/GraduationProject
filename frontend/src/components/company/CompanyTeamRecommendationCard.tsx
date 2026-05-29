import { useMemo } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import type {
  CompanyRequestInvitationStatus,
  CompanyRequestTeamRecommendation,
} from "@/api/companyApi";

const ROLE_CHIP_CLASSES = [
  "bg-primary/15 text-primary hover:bg-primary/15",
  "bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10",
  "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10",
  "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/10",
] as const;

type Props = {
  team: CompanyRequestTeamRecommendation;
  invitingTeamId?: number | null;
  invitationStatusByStudentId: Map<number, CompanyRequestInvitationStatus>;
  onViewTeam: (team: CompanyRequestTeamRecommendation) => void;
  onInviteTeam: (team: CompanyRequestTeamRecommendation) => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function chemistryLabel(score: number): string | null {
  if (score >= 85) return "High chemistry";
  if (score >= 70) return "Strong fit";
  if (score >= 55) return "Balanced";
  return null;
}

function oneLine(text: string, max = 96): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function shortRoleLabel(roleName: string): string {
  const words = roleName.trim().split(/\s+/);
  if (words.length <= 2) return roleName;
  return words[0];
}

export function CompanyTeamRecommendationCard({
  team,
  invitingTeamId,
  invitationStatusByStudentId,
  onViewTeam,
  onInviteTeam,
}: Props) {
  const chemistry = useMemo(() => chemistryLabel(team.compatibilityScore), [team.compatibilityScore]);

  const allInvited = team.members.every((m) => {
    const status = invitationStatusByStudentId.get(m.studentProfileId);
    return status === "pending" || status === "accepted";
  });

  const strength = team.strengths.find(Boolean);
  const risk = team.risks.find(Boolean);

  return (
    <Card className="cw-card-elevated h-full transition-shadow hover:shadow-md border border-border/50">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base tracking-tight">Team #{team.teamRank}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span>{team.members.length} members</span>
              {chemistry && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-primary/90">{chemistry}</span>
                </>
              )}
            </p>
          </div>
          <CompatibilityRing value={team.totalScore} size={52} />
        </div>

        {team.summaryReason && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-1">
            {oneLine(team.summaryReason, 110)}
          </p>
        )}

        <div className="flex -space-x-2 mt-4" aria-hidden>
          {team.members.slice(0, 5).map((member) => (
            <Avatar key={member.studentProfileId} className="h-8 w-8 border-2 border-card">
              <AvatarFallback className="cw-candidate-avatar-fallback text-[10px] font-medium">
                {initials(member.studentName)}
              </AvatarFallback>
            </Avatar>
          ))}
          {team.members.length > 5 && (
            <div className="h-8 w-8 rounded-full border-2 border-card bg-muted grid place-items-center text-[10px] font-medium text-muted-foreground">
              +{team.members.length - 5}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {team.members.map((member, index) => (
            <Badge
              key={`${member.companyRequestRoleId}-${member.studentProfileId}`}
              className={`${ROLE_CHIP_CLASSES[index % ROLE_CHIP_CLASSES.length]} rounded-md border-0 text-[10px] font-normal px-2 py-0 h-5`}
            >
              {shortRoleLabel(member.roleName)}
            </Badge>
          ))}
        </div>

        {(strength || risk) && (
          <div
            className={`mt-3 grid gap-2 text-[11px] leading-snug ${strength && risk ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {strength && (
              <div className="px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 line-clamp-2">
                + {oneLine(strength, 48)}
              </div>
            )}
            {risk && (
              <div className="px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-200 line-clamp-2">
                ! {oneLine(risk, 48)}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl h-9"
            onClick={() => onViewTeam(team)}
          >
            View team
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1 rounded-xl h-9 cw-btn-gradient shadow-sm border-0"
            onClick={() => onInviteTeam(team)}
            disabled={allInvited || invitingTeamId === team.teamId}
          >
            <Users className="h-3.5 w-3.5 mr-1 shrink-0" />
            {invitingTeamId === team.teamId
              ? "Inviting…"
              : allInvited
                ? "Invited"
                : "Invite team"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
