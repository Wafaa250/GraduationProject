import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import type { CompanyRequestTeamRecommendation } from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";

const ROLE_CHIP_CLASSES = [
  "bg-primary/15 text-primary hover:bg-primary/15",
  "bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10",
  "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10",
  "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/10",
] as const;

type Props = {
  requestId: number;
  team: CompanyRequestTeamRecommendation;
  saved?: boolean;
  saveDisabled?: boolean;
  onToggleSave?: () => void;
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
  requestId,
  team,
  saved = false,
  saveDisabled = false,
  onToggleSave,
}: Props) {
  const chemistry = useMemo(() => chemistryLabel(team.compatibilityScore), [team.compatibilityScore]);

  const teamSignalLabel =
    team.roleCoverageScore >= 85
      ? "High role coverage"
      : team.roleCoverageScore >= 70
        ? "Strong role coverage"
        : "Balanced role coverage";

  return (
    <Card className="cw-card-elevated h-full transition-shadow hover:shadow-md border border-border/50">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base tracking-tight">Team #{team.teamRank}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span>{team.members.length} members</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{team.roleCoverageScore}% role coverage</span>
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
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">
            {oneLine(team.summaryReason, 140)}
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

        <div className="mt-3">
          <Badge
            variant="outline"
            className="rounded-md text-[10px] font-medium border-emerald-200/80 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
          >
            ✓ {teamSignalLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            asChild
            size="sm"
            className="rounded-xl h-9 cw-btn-gradient shadow-sm border-0 flex-1"
          >
            <Link to={COMPANY_ROUTES.teamDiscoveryProfile(requestId, team.teamId)}>
              <Sparkles className="h-3.5 w-3.5 mr-1 shrink-0" />
              Review Team
            </Link>
          </Button>
          {onToggleSave ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn("rounded-xl shrink-0 h-9", saved && "text-primary bg-primary/10")}
              aria-label={saved ? "Unsave team" : "Save team"}
              disabled={saveDisabled}
              onClick={onToggleSave}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
