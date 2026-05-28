import { useMemo } from "react";
import { FolderKanban, Sparkles, Users2 } from "lucide-react";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import type { SectionWorkspacePanelProps } from "@/components/doctor/course-workspace/types";
import type { CourseTeamView } from "@/hooks/useCourseWorkspace";
import { initialsFromName } from "@/lib/doctorHubMappers";

function TeamCard({
  courseProjectTitle,
  team,
}: {
  courseProjectTitle: string;
  team: CourseTeamView["team"];
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Users2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">Team {team.teamIndex + 1}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <FolderKanban className="h-3 w-3 shrink-0" />
            <span className="truncate">{courseProjectTitle}</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {team.members.map((member) => (
          <span
            key={member.studentId}
            title={member.name}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-primary/10 text-[10px] font-semibold text-primary"
          >
            {initialsFromName(member.name)}
          </span>
        ))}
        {team.memberCount === 0 ? (
          <span className="text-[11px] text-muted-foreground">No members yet</span>
        ) : null}
      </div>
    </article>
  );
}

export function SectionTeamsPanel({ bundle, bundleLoading }: SectionWorkspacePanelProps) {
  const { doctorTeams, studentTeams } = useMemo(() => {
    const teams = bundle?.teams ?? [];
    const projects = bundle?.courseProjects ?? [];
    const aiByProject = new Map(projects.map((p) => [p.id, p.aiMode]));

    const doctor: typeof teams = [];
    const student: typeof teams = [];
    for (const entry of teams) {
      const mode = aiByProject.get(entry.courseProjectId);
      if (mode === "student") student.push(entry);
      else doctor.push(entry);
    }
    return { doctorTeams: doctor, studentTeams: student };
  }, [bundle]);

  if (bundleLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
    );
  }

  const total = doctorTeams.length + studentTeams.length;

  if (total === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={Users2}
        title="No teams yet"
        description="Teams appear after you generate them or students form teams on section projects."
      />
    );
  }

  return (
    <div className="space-y-6">
      {doctorTeams.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Doctor-generated teams</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {doctorTeams.map((entry) => (
              <TeamCard
                key={entry.team.teamId}
                courseProjectTitle={entry.courseProjectTitle}
                team={entry.team}
              />
            ))}
          </div>
        </section>
      ) : null}

      {studentTeams.length > 0 ? (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Student-created teams
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {studentTeams.map((entry) => (
              <TeamCard
                key={entry.team.teamId}
                courseProjectTitle={entry.courseProjectTitle}
                team={entry.team}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
