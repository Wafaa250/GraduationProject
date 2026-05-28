import type { CourseWorkspaceData } from "@/components/doctor/course-workspace/types";

type CourseWorkspaceHeroProps = {
  course: CourseWorkspaceData;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function CourseWorkspaceHero({ course }: CourseWorkspaceHeroProps) {
  const sectionsValue = course.loading ? "…" : String(course.sections);
  const studentsValue = course.loading ? "…" : String(course.students);
  const projectsValue = course.loading ? "…" : String(course.projects);

  return (
    <header className="rounded-xl border border-border/70 bg-card px-5 py-4 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {course.code ? (
            <span className="inline-flex shrink-0 items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {course.code}
            </span>
          ) : null}
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {course.name || "Untitled course"}
          </h1>
          {course.semester ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">· {course.semester}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <Stat label="Sections" value={sectionsValue} />
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <Stat label="Students" value={studentsValue} />
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <Stat label="Course projects" value={projectsValue} />
        </div>
      </div>
    </header>
  );
}
