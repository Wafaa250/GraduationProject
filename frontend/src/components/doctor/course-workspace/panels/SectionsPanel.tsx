import { ChevronRight, FolderKanban, Layers, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import type { CourseWorkspacePanelProps } from "@/components/doctor/course-workspace/types";

function formatSchedule(days: string[], timeFrom: string | null, timeTo: string | null) {
  const dayLabel = days.length > 0 ? days.join(", ") : "Schedule not set";
  if (timeFrom && timeTo) return `${dayLabel} · ${timeFrom}–${timeTo}`;
  return dayLabel;
}

export function SectionsPanel({ bundle, bundleLoading }: CourseWorkspacePanelProps) {
  if (bundleLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-border/60 bg-white p-5 shadow-card">
            <div className="h-5 w-24 animate-pulse rounded-md bg-secondary" />
            <div className="mt-3 h-3 w-40 animate-pulse rounded bg-secondary" />
            <div className="mt-6 flex gap-4">
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-secondary" />
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sections = bundle?.sections ?? [];

  if (sections.length === 0) {
    return (
      <CourseWorkspaceEmptyState
        icon={Layers}
        title="No sections yet"
        description="Create sections to organize enrolled students and assign course team-formation projects."
        action={
          <Button
            type="button"
            className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Create section
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <article
          key={section.id}
          className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <header className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold text-foreground">{section.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatSchedule(section.days, section.timeFrom, section.timeTo)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Capacity {section.studentCount}/{section.capacity}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/15">
              Active
            </span>
          </header>

          <div className="flex gap-3">
            <div className="flex-1 rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" /> Students
              </div>
              <div className="mt-1 font-display text-lg font-bold text-foreground">{section.studentCount}</div>
            </div>
            <div className="flex-1 rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <FolderKanban className="h-3 w-3" /> Projects
              </div>
              <div className="mt-1 font-display text-lg font-bold text-foreground">
                {section.courseProjectCount}
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Section supervision</span>
            <Button type="button" size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
              View students <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </footer>
        </article>
      ))}
    </div>
  );
}
