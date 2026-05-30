import { ArrowRight, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CourseTeam } from "@/api/doctorCoursesApi";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { getTeamColorTheme } from "@/lib/courseTeamColors";
import { cn } from "@/lib/utils";

type TeamCardProps = {
  team: CourseTeam;
  onView: () => void;
};

export function TeamCard({ team, onView }: TeamCardProps) {
  const teamName = `Team ${team.teamIndex + 1}`;
  const theme = getTeamColorTheme(team.teamIndex);

  return (
    <article
      className={cn("cpw-team-card", theme.borderClass)}
    >
      <div className={cn("cpw-team-card__header", theme.headerClass)}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              theme.iconBgClass,
              theme.iconClass,
            )}
          >
            <Users2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{teamName}</h3>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", theme.badgeClass)}>
                {theme.label}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="cpw-team-card__body">
        {team.members.length > 0 ? (
          <ul className="space-y-1.5">
            {team.members.slice(0, 5).map((member) => (
              <li key={member.studentId} className="flex items-center gap-2 text-[12px]">
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full text-[9px] font-semibold ring-1",
                    theme.iconBgClass,
                    theme.iconClass,
                    theme.ringClass,
                  )}
                >
                  {initialsFromName(member.name)}
                </span>
                <span className="truncate text-foreground">{member.name}</span>
              </li>
            ))}
            {team.members.length > 5 ? (
              <li className="text-[11px] text-muted-foreground">+{team.members.length - 5} more</li>
            ) : null}
          </ul>
        ) : (
          <p className="text-[12px] text-muted-foreground">No members assigned</p>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row">
          <Button type="button" size="sm" className="flex-1" onClick={onView}>
            View team
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
