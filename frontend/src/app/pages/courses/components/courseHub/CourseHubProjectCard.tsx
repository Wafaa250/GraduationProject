import { Link } from "react-router-dom";
import { ArrowRight, Clock, Users } from "lucide-react";

import { hubTeamChoicePath } from "../../../../../api/studentCoursesHubApi";
import { Button } from "../../../../components/ui/button";
import { AiModeChip, HasTeamBadge } from "./CourseHubBadges";
import { isDoctorAssignedProject, type CourseProject } from "../studentCourseHelpers";

/**
 * Project card on course detail — spacing and layout match Lovable CourseDetailPage.
 */
export function CourseHubProjectCard({
  project,
  courseId,
}: {
  project: CourseProject;
  courseId: number;
}) {
  const isDoctorAssigned = isDoctorAssignedProject(project);
  const hasTeam = project.hasTeam === true;
  const description = project.description?.trim() ?? "";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-elegant">
      <div className="p-6">
        {/* Title row + badges */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="font-display text-xl font-bold leading-tight text-foreground">
              {project.title}
            </h3>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <AiModeChip mode={project.aiMode} />
            <HasTeamBadge has={hasTeam} />
          </div>
        </div>

        {/* Team size / scope */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            Team size:{" "}
            <strong className="font-semibold text-foreground">{project.teamSize}</strong>
          </span>
          {project.applyToAllSections ? (
            <span className="inline-flex items-center gap-1.5">All sections</span>
          ) : null}
          {project.allowCrossSectionTeams ? (
            <span className="inline-flex items-center gap-1.5">
              Cross-section teams allowed
            </span>
          ) : null}
        </div>

        {/* Actions — divider sits directly under meta, fixed padding below */}
        <div className="mt-5 border-t border-border pt-4">
          {hasTeam ? (
            <Button
              asChild
              className="h-10 rounded-full bg-gradient-primary px-5 shadow-glow hover:opacity-90"
            >
              <Link to={`/student/courses/${courseId}/projects/${project.id}/team`}>
                View my team
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : project.aiMode === "student" && !isDoctorAssigned ? (
            <Button
              asChild
              className="h-10 rounded-full bg-gradient-primary px-5 shadow-glow hover:opacity-90"
            >
              <Link
                to={hubTeamChoicePath(courseId, project.id)}
                state={{ projectTitle: project.title }}
              >
                Choose team formation
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="course-hub-chip gap-2 px-4 py-2 text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              Waiting for doctor to generate teams
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
