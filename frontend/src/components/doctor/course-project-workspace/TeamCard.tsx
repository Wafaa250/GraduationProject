import { ArrowRight, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CourseTeam } from "@/api/doctorCoursesApi";
import { initialsFromName } from "@/lib/doctorHubMappers";

type TeamCardProps = {
  team: CourseTeam;
  onView: () => void;
};

export function TeamCard({ team, onView }: TeamCardProps) {
  const teamName = `Team ${team.teamIndex + 1}`;

  return (
    <article className="flex flex-col rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Users2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{teamName}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {team.members.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {team.members.slice(0, 5).map((member) => (
            <li key={member.studentId} className="flex items-center gap-2 text-[12px]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                {initialsFromName(member.name)}
              </span>
              <span className="truncate text-foreground">{member.name}</span>
            </li>
          ))}
          {team.members.length > 5 ? (
            <li className="text-[11px] text-muted-foreground">
              +{team.members.length - 5} more
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-muted-foreground">No members assigned</p>
      )}

      <div className="mt-4 border-t border-border/60 pt-3">
        <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={onView}>
          View team
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
