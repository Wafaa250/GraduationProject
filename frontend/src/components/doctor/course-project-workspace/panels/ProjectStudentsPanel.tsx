import { GraduationCap } from "lucide-react";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import { ProjectStudentCard } from "@/components/doctor/course-project-workspace/ProjectStudentCard";
import type { CourseProjectWorkspacePanelProps } from "@/components/doctor/course-project-workspace/types";
import { getProjectStudentTeamStatus } from "@/lib/courseProjectStudentStatus";
import { doctorStudentPath } from "@/routes/paths";

export function ProjectStudentsPanel({ workspace, bundle, bundleLoading }: CourseProjectWorkspacePanelProps) {
  if (bundleLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
    );
  }

  const students = bundle?.eligibleStudents ?? [];
  const teams = bundle?.teams?.teams ?? [];

  const assignmentByStudent = new Map<number, { teamLabel: string }>();
  for (const team of teams) {
    for (const member of team.members) {
      assignmentByStudent.set(member.studentId, {
        teamLabel: `Team ${team.teamIndex + 1}`,
      });
    }
  }

  const teamSize = bundle?.teams?.teamSize ?? workspace.teamSize;
  const hasOpenTeamSlot = teams.some((t) => t.memberCount < teamSize);

  if (students.length === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={GraduationCap}
        title="No eligible students"
        description="Enroll students in this project's sections to include them in team formation."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-muted-foreground">
        Students in sections assigned to{" "}
        <span className="font-medium text-foreground">{workspace.projectTitle}</span>
      </p>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card divide-y divide-border/60">
        {students.map((student) => {
          const assignment = assignmentByStudent.get(student.studentId);
          const status = getProjectStudentTeamStatus({
            isOnProjectTeam: Boolean(assignment),
            aiMode: workspace.aiMode,
            teamCount: workspace.teamCount,
            hasOpenTeamSlot,
          });
          const profilePath =
            student.userId != null && student.userId > 0 ? doctorStudentPath(student.userId) : null;

          return (
            <ProjectStudentCard
              key={student.studentId}
              student={student}
              status={status}
              teamLabel={assignment?.teamLabel}
              profilePath={profilePath}
            />
          );
        })}
      </div>
    </div>
  );
}
