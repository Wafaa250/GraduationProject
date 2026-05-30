import { Link } from "react-router-dom";
import type { CourseEnrolledStudent } from "@/api/doctorCoursesApi";
import { initialsFromName } from "@/lib/doctorHubMappers";
import {
  PROJECT_STUDENT_STATUS_CLASS,
  type ProjectStudentStatusMeta,
} from "@/lib/courseProjectStudentStatus";
import { cn } from "@/lib/utils";

const MAX_SKILL_CHIPS = 4;

type ProjectStudentCardProps = {
  student: CourseEnrolledStudent;
  status: ProjectStudentStatusMeta;
  teamLabel?: string;
  profilePath: string | null;
};

export function ProjectStudentCard({
  student,
  status,
  teamLabel,
  profilePath,
}: ProjectStudentCardProps) {
  const skills = (student.skills ?? []).slice(0, MAX_SKILL_CHIPS);

  return (
    <article className="cpw-student-card">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-2 ring-white">
        {initialsFromName(student.name ?? "?")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {student.name ?? "Student"}
          </h3>
          <span className={cn(PROJECT_STUDENT_STATUS_CLASS[status.status])}>{status.label}</span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {student.major?.trim() || "Major not listed"}
          {student.universityId ? ` · ${student.universityId}` : ""}
        </p>
        {teamLabel ? (
          <p className="mt-0.5 text-[11px] font-medium text-foreground/85">{teamLabel}</p>
        ) : status.detail ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{status.detail}</p>
        ) : null}
        {skills.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {profilePath ? (
        <Link
          to={profilePath}
          className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          Profile
        </Link>
      ) : null}
    </article>
  );
}
