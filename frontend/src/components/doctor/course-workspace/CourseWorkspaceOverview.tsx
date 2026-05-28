import {
  ArrowUpRight,
  FolderKanban,
  GraduationCap,
  Layers,
  type LucideIcon,
} from "lucide-react";
import type { CourseWorkspaceData, OverviewMetricState } from "@/components/doctor/course-workspace/types";

type OverviewItem = {
  icon: LucideIcon;
  label: string;
  hint: string;
  resolveState: (course: CourseWorkspaceData) => OverviewMetricState;
  resolveValue: (course: CourseWorkspaceData) => string | null;
};

const items: OverviewItem[] = [
  {
    icon: GraduationCap,
    label: "Students",
    hint: "Enrolled in this course",
    resolveState: (c) => (c.loading ? "loading" : c.students > 0 ? "value" : "empty"),
    resolveValue: (c) => (c.students > 0 ? String(c.students) : null),
  },
  {
    icon: FolderKanban,
    label: "Course projects",
    hint: "Team formation projects",
    resolveState: (c) => (c.loading ? "loading" : c.projects > 0 ? "value" : "empty"),
    resolveValue: (c) => (c.projects > 0 ? String(c.projects) : null),
  },
  {
    icon: Layers,
    label: "Sections",
    hint: "Enrollment groups in this course",
    resolveState: (c) => (c.loading ? "loading" : c.sections > 0 ? "value" : "empty"),
    resolveValue: (c) => (c.sections > 0 ? String(c.sections) : null),
  },
];

function renderValue(state: OverviewMetricState, value: string | null) {
  if (state === "loading") {
    return <div className="h-7 w-12 animate-pulse rounded-md bg-secondary" />;
  }
  if (state === "value" && value) {
    return <span className="font-display text-2xl font-bold tracking-tight text-foreground">{value}</span>;
  }
  if (state === "empty") {
    return <span className="font-display text-2xl font-bold text-muted-foreground/50">—</span>;
  }
  return <span className="text-xs font-medium text-muted-foreground">Not connected</span>;
}

type CourseWorkspaceOverviewProps = {
  course: CourseWorkspaceData;
};

export function CourseWorkspaceOverview({ course }: CourseWorkspaceOverviewProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ icon: Icon, label, hint, resolveState, resolveValue }) => {
        const state = resolveState(course);
        const value = resolveValue(course);

        return (
          <div
            key={label}
            className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <span className="rounded-full p-1 text-muted-foreground/40" aria-hidden>
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground">{label}</div>
              <div className="flex h-8 items-end">{renderValue(state, value)}</div>
              <div className="text-[11px] text-muted-foreground/80">{hint}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
