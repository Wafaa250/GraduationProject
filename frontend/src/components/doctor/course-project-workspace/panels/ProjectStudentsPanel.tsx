import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import type { CourseProjectWorkspacePanelProps } from "@/components/doctor/course-project-workspace/types";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { doctorStudentPath } from "@/routes/paths";

export function ProjectStudentsPanel({ workspace, bundle, bundleLoading }: CourseProjectWorkspacePanelProps) {
  if (bundleLoading) {
    return <div className="h-48 animate-pulse rounded-xl border border-border/60 bg-card" />;
  }

  const students = bundle?.eligibleStudents ?? [];
  const teams = bundle?.teams?.teams ?? [];

  const assignmentByStudent = new Map<number, { teamLabel: string }>();
  for (const team of teams) {
    for (const member of team.members) {
      assignmentByStudent.set(member.studentId, { teamLabel: `Team ${team.teamIndex + 1}` });
    }
  }

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
      <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
        {students.map((student) => {
          const assignment = assignmentByStudent.get(student.studentId);
          const profilePath =
            student.userId != null && student.userId > 0 ? doctorStudentPath(student.userId) : null;

          return (
            <div key={student.studentId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {initialsFromName(student.name ?? "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{student.name ?? "Student"}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {student.universityId ?? "—"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {assignment ? assignment.teamLabel : "Not on a project team"}
                </div>
              </div>
              {profilePath ? (
                <Link
                  to={profilePath}
                  className="shrink-0 text-[11px] font-medium text-primary hover:underline"
                >
                  Profile
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
