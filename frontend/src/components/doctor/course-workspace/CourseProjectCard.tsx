import { Link } from "react-router-dom";
import { FolderOpen, Settings2 } from "lucide-react";
import type { CourseProjectWithTeams } from "@/api/doctorCoursesApi";
import {
  formatAiMode,
  formatProjectSections,
} from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import { parseAiFormationFromDescription } from "@/components/doctor/course-project-workspace/courseProjectAiConfig";
import { doctorCourseProjectPath } from "@/routes/paths";
import { Button } from "@/components/ui/button";

type CourseProjectCardProps = {
  courseId: number;
  sectionId: number;
  project: CourseProjectWithTeams;
  onManage: () => void;
};

export function CourseProjectCard({
  courseId,
  sectionId,
  project,
  onManage,
}: CourseProjectCardProps) {
  const workspacePath = doctorCourseProjectPath(courseId, sectionId, project.id);
  const teamCount = typeof project.teamCount === "number" ? project.teamCount : 0;
  const { publicDescription } = parseAiFormationFromDescription(project.description);

  return (
    <article className="rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{project.title}</h3>
          {publicDescription ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{publicDescription}</p>
          ) : null}
          <dl className="mt-3 grid gap-2 text-[12px] sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Sections</dt>
              <dd className="font-medium text-foreground">{formatProjectSections(project)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Team size</dt>
              <dd className="font-medium tabular-nums text-foreground">{project.teamSize}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Teams</dt>
              <dd className="font-medium tabular-nums text-foreground">{teamCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Formation</dt>
              <dd className="font-medium text-foreground">{formatAiMode(project.aiMode)}</dd>
            </div>
          </dl>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button type="button" size="sm" variant="outline" onClick={onManage}>
            <Settings2 className="h-4 w-4" />
            Manage project
          </Button>
          <Button type="button" size="sm" asChild>
            <Link to={workspacePath}>
              <FolderOpen className="h-4 w-4" />
              Open workspace
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
