import { Link } from "react-router-dom";

import type { CourseStudent } from "../../../../../api/studentCoursesApi";
import { getProfileUrl } from "../../../../components/common/ProfileLink";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { cn } from "../../../../components/ui/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Classmates row — horizontal layout matching Lovable CourseDetailPage. */
export function CourseHubRosterCard({ student }: { student: CourseStudent }) {
  const studentName =
    typeof student.name === "string" && student.name.trim()
      ? student.name.trim()
      : typeof student.Name === "string" && student.Name.trim()
        ? student.Name.trim()
        : "Student";
  const major =
    (typeof student.major === "string" && student.major.trim()) ||
    (typeof student.Major === "string" && student.Major.trim()) ||
    "";
  const universityId =
    (typeof student.universityId === "string" && student.universityId.trim()) ||
    (typeof student.UniversityId === "string" && student.UniversityId.trim()) ||
    "";
  const subtitle =
    major && universityId
      ? `${major} · ${universityId}`
      : major || universityId || "";

  const userId = student.userId ?? student.UserId;
  const profileHref = getProfileUrl({ role: "student", userId });

  return (
    <div
      className={cn(
        "flex w-full flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4",
        "shadow-card transition-shadow hover:shadow-elegant",
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary">
          {initials(studentName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-0.5">
        {profileHref ? (
          <Link
            to={profileHref}
            className="block truncate text-sm font-medium leading-tight text-foreground transition-colors hover:text-primary"
          >
            {studentName}
          </Link>
        ) : (
          <p className="truncate text-sm font-medium leading-tight text-foreground">
            {studentName}
          </p>
        )}
        {subtitle ? (
          <p className="truncate text-xs leading-snug text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
