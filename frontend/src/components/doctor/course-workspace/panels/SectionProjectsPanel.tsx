import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseWorkspaceEmptyState } from "@/components/doctor/course-workspace/CourseWorkspaceEmptyState";
import { CourseProjectCard } from "@/components/doctor/course-workspace/CourseProjectCard";
import { CourseProjectCreatePanel } from "@/components/doctor/course-workspace/CourseProjectCreatePanel";
import { CourseProjectFormDialog } from "@/components/doctor/course-workspace/dialogs/CourseProjectFormDialog";
import type { CourseProjectWithTeams } from "@/api/doctorCoursesApi";
import type { SectionWorkspacePanelProps } from "@/components/doctor/course-workspace/types";

export function SectionProjectsPanel({ section, bundle, bundleLoading, onReload }: SectionWorkspacePanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<CourseProjectWithTeams | null>(null);

  if (bundleLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-border/60 bg-card" />
        ))}
      </div>
    );
  }

  if (!bundle) {
    return (
      <CourseWorkspaceEmptyState
        icon={FolderKanban}
        title="Could not load projects"
        description="Reload the page or open the section again."
        compact
      />
    );
  }

  const projects = bundle.courseProjects;
  const allSections = bundle.allSections;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{projects.length}</span> project
          {projects.length === 1 ? "" : "s"} assigned to this section
        </p>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)} disabled={createOpen}>
          <Plus className="h-4 w-4" />
          Create project
        </Button>
      </div>

      <CourseProjectCreatePanel
        open={createOpen}
        courseId={section.courseId}
        sections={allSections}
        defaultSectionId={section.sectionId}
        onClose={() => setCreateOpen(false)}
        onSaved={onReload}
      />

      {projects.length === 0 && !createOpen ? (
        <CourseWorkspaceEmptyState
          icon={FolderKanban}
          title="No projects for this section"
          description="Create a course project and assign it to this section for team formation."
          action={
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create project
            </Button>
          }
        />
      ) : projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <CourseProjectCard
              key={project.id}
              courseId={section.courseId}
              sectionId={section.sectionId}
              project={project}
              onManage={() => setEditProject(project)}
            />
          ))}
        </div>
      ) : null}

      <CourseProjectFormDialog
        open={editProject != null}
        courseId={section.courseId}
        sections={allSections}
        project={editProject}
        onClose={() => setEditProject(null)}
        onSaved={onReload}
      />
    </div>
  );
}
