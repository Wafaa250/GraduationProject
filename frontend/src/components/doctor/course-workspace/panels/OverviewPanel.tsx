import { useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import { SectionFormDialog } from "@/components/doctor/course-workspace/dialogs/SectionFormDialog";
import type { CourseSection } from "@/api/doctorCoursesApi";
import { deleteCourseSection } from "@/api/doctorCoursesApi";
import type { CourseWorkspacePanelProps } from "@/components/doctor/course-workspace/types";
import { formatSectionSchedule } from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

export function OverviewPanel({ course, bundle, bundleLoading, onReload }: CourseWorkspacePanelProps) {
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);

  if (bundleLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
    );
  }

  const sections = bundle?.sections ?? [];
  const students = bundle?.students.length ?? 0;
  const projects = bundle?.courseProjects.length ?? 0;
  const teams = bundle?.teams.length ?? 0;

  const handleDeleteSection = async (section: CourseSection) => {
    if (!window.confirm(`Delete section "${section.name}"?`)) return;
    try {
      await deleteCourseSection(section.id);
      toast({ title: "Section deleted" });
      onReload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete section",
        description: parseApiErrorMessage(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Sections</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{sections.length}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Students</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{students}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Course projects</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{projects}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{teams} teams formed</div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Sections</h2>
            <p className="text-[12px] text-muted-foreground">
              Manage schedules, capacity, and enrollment groups.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingSection(null);
              setSectionDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create section
          </Button>
        </div>

        {sections.length === 0 ? (
          <CourseWorkspaceEmptyState
            icon={Layers}
            title="No sections yet"
            description="Create a section to enroll students and assign course projects."
            compact
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-xl border border-border/70 bg-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{section.name}</div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatSectionSchedule(section.days, section.timeFrom, section.timeTo)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      aria-label="Edit section"
                      onClick={() => {
                        setEditingSection(section);
                        setSectionDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete section"
                      onClick={() => handleDeleteSection(section)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <dt className="text-muted-foreground">Students</dt>
                    <dd className="font-semibold tabular-nums">{section.studentCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Capacity</dt>
                    <dd className="font-semibold tabular-nums">{section.capacity}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Projects</dt>
                    <dd className="font-semibold tabular-nums">{section.courseProjectCount}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      <SectionFormDialog
        open={sectionDialogOpen}
        courseId={course.courseId}
        section={editingSection}
        onClose={() => {
          setSectionDialogOpen(false);
          setEditingSection(null);
        }}
        onSaved={onReload}
      />
    </div>
  );
}
