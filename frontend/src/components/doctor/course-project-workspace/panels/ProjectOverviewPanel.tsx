import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseProjectFormDialog } from "@/components/doctor/course-workspace/dialogs/CourseProjectFormDialog";
import {
  formatAiMode,
  formatProjectSections,
} from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import { deleteCourseProject } from "@/api/doctorCoursesApi";
import { parseAiFormationFromDescription } from "@/components/doctor/course-project-workspace/courseProjectAiConfig";
import type { CourseProjectWorkspacePanelProps } from "@/components/doctor/course-project-workspace/types";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { doctorSectionPath } from "@/routes/paths";

export function ProjectOverviewPanel({
  workspace,
  bundle,
  bundleLoading,
  onReload,
}: CourseProjectWorkspacePanelProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (bundleLoading || !bundle) {
    return <div className="h-40 animate-pulse rounded-xl border border-border/60 bg-card" />;
  }

  const { publicDescription } = parseAiFormationFromDescription(bundle.project.description);
  const projectWithTeams = {
    ...bundle.project,
    teamCount: bundle.teams?.teamCount ?? workspace.teamCount,
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${bundle.project.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteCourseProject(bundle.project.id);
      toast({ title: "Project deleted" });
      navigate(doctorSectionPath(workspace.courseId, workspace.sectionId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete project",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <dl className="grid gap-4 rounded-xl border border-border/70 bg-card p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Sections</dt>
          <dd className="mt-0.5 font-medium">{formatProjectSections(projectWithTeams)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Formation</dt>
          <dd className="mt-0.5">{formatAiMode(bundle.project.aiMode)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Team size</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{bundle.project.teamSize}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Teams</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{bundle.teams?.teamCount ?? 0}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Cross-section</dt>
          <dd className="mt-0.5">
            {bundle.project.allowCrossSectionTeams ? "Allowed" : "Same section only"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Eligible students</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{bundle.eligibleStudents.length}</dd>
        </div>
      </dl>

      {publicDescription ? (
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{publicDescription}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Edit project
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-4 w-4" />
          Delete project
        </Button>
      </div>

      <CourseProjectFormDialog
        open={editOpen}
        courseId={workspace.courseId}
        sections={bundle.allSections}
        project={projectWithTeams}
        defaultSectionId={workspace.sectionId}
        onClose={() => setEditOpen(false)}
        onSaved={onReload}
      />
    </div>
  );
}
