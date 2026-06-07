import { useState } from "react";
import { Users2 } from "lucide-react";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import { TeamCard } from "@/components/doctor/course-project-workspace/TeamCard";
import { ViewTeamDialog } from "@/components/doctor/course-project-workspace/ViewTeamDialog";
import type { CourseTeam } from "@/api/doctorCoursesApi";
import type { CourseProjectWorkspacePanelProps } from "@/components/doctor/course-project-workspace/types";

export function ProjectTeamsPanel({
  workspace,
  bundle,
  bundleLoading,
  previewTeams,
}: CourseProjectWorkspacePanelProps) {
  const [viewTeam, setViewTeam] = useState<CourseTeam | null>(null);

  if (bundleLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
    );
  }

  const savedTeams = bundle?.teams?.teams ?? [];
  const isPreview = (previewTeams?.teams.length ?? 0) > 0;
  const teams = isPreview ? previewTeams!.teams : savedTeams;

  if (teams.length === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={Users2}
        title="No teams yet"
        description={
          workspace.aiMode === "student"
            ? "Teams appear when students form groups on this project."
            : "Configure AI team formation, preview teams, then generate them for this project."
        }
      />
    );
  }

  return (
    <>
      <p className="mb-3 text-[12px] text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">{teams.length}</span> team
        {teams.length === 1 ? "" : "s"} for this project
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {teams.map((team) => (
          <TeamCard key={team.teamId || team.teamIndex} team={team} onView={() => setViewTeam(team)} />
        ))}
      </div>
      <ViewTeamDialog
        open={viewTeam != null}
        team={viewTeam}
        projectTitle={workspace.projectTitle}
        onClose={() => setViewTeam(null)}
      />
    </>
  );
}
