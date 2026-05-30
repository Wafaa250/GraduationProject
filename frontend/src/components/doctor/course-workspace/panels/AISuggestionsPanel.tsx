import { Flag, FolderKanban, Sparkles, Users2 } from "lucide-react";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import type { CourseWorkspacePanelProps } from "@/components/doctor/course-workspace/types";

export function AISuggestionsPanel({ bundle, bundleLoading }: CourseWorkspacePanelProps) {
  if (bundleLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-border/60 bg-card shadow-card" />
        ))}
      </div>
    );
  }

  const projectsWithoutTeams = (bundle?.courseProjects ?? []).filter((p) => p.teamCount === 0);
  const teamsNeedingMembers = (bundle?.teams ?? []).filter((entry) => entry.team.memberCount === 0);

  const hasSuggestions = projectsWithoutTeams.length > 0 || teamsNeedingMembers.length > 0;

  if (!hasSuggestions) {
    return (
      <CourseWorkspaceEmptyState
        icon={Sparkles}
        title="No team-formation reminders"
        description="When course projects need teams generated or teams are still empty, reminders will appear here from real course data."
        compact
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Reminders for course project setup and team formation — not graduation project supervision.
      </p>

      {projectsWithoutTeams.length > 0 ? (
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FolderKanban className="h-4 w-4 text-primary" />
            Projects without teams
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {projectsWithoutTeams.slice(0, 6).map((project) => (
              <li key={project.id} className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate font-medium text-foreground">{project.title}</span>
                <span>— generate teams from the Projects tab</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {teamsNeedingMembers.length > 0 ? (
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users2 className="h-4 w-4 text-primary" />
            Empty team slots
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {teamsNeedingMembers.slice(0, 4).map((entry) => (
              <li key={entry.team.teamId} className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 text-primary" />
                Empty team on {entry.courseProjectTitle}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
