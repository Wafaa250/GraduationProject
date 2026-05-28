import { Activity, FolderKanban, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import type { CourseWorkspacePanelProps } from "@/components/doctor/course-workspace/types";
import { initialsFromName } from "@/lib/doctorHubMappers";

export function TeamsPanel({ bundle, bundleLoading }: CourseWorkspacePanelProps) {
  if (bundleLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl border border-border/60 bg-white shadow-card" />
        ))}
      </div>
    );
  }

  const teams = bundle?.teams ?? [];

  if (teams.length === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={Users2}
        title="No teams formed yet"
        description="Teams appear when students are assigned to course projects. Generate or manage teams from a course project to see them here."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {teams.map(({ courseProjectId, courseProjectTitle, team }) => (
        <article
          key={team.teamId}
          className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-5 shadow-card"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Users2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold text-foreground">
                Team {team.teamIndex + 1}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <FolderKanban className="h-3 w-3" />
                <span className="truncate">{courseProjectTitle}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {team.memberCount} member{team.memberCount === 1 ? "" : "s"} · Project #{courseProjectId}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {team.members.map((member) => (
              <span
                key={member.studentId}
                title={member.name}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-primary/10 text-[10px] font-semibold text-primary"
              >
                {initialsFromName(member.name)}
              </span>
            ))}
          </div>

          <div className="flex gap-2 border-t border-border pt-3">
            <Button type="button" size="sm" variant="outline" className="rounded-full" disabled>
              <Activity className="h-3.5 w-3.5" />
              Activity
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
