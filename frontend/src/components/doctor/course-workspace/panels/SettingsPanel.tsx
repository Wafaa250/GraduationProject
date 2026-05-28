import { Label } from "@/components/ui/label";
import type { CourseWorkspacePanelProps } from "@/components/doctor/course-workspace/types";

export function SettingsPanel({ course }: CourseWorkspacePanelProps) {
  return (
    <section className="max-w-2xl rounded-2xl border border-border/60 bg-white p-6 shadow-card">
      <header className="mb-5">
        <h3 className="font-display text-base font-semibold text-foreground">Course information</h3>
        <p className="text-xs text-muted-foreground">
          Read-only details from your course record. Advanced policies are not configured in SkillSwap yet.
        </p>
      </header>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Course title</Label>
          <dd className="mt-1 text-sm font-medium text-foreground">{course.name || "—"}</dd>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Course code</Label>
          <dd className="mt-1 text-sm font-medium text-foreground">{course.code || "—"}</dd>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Semester</Label>
          <dd className="mt-1 text-sm font-medium text-foreground">{course.semester || "—"}</dd>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Sections</Label>
          <dd className="mt-1 text-sm font-medium text-foreground">{course.sections}</dd>
        </div>
      </dl>
    </section>
  );
}
