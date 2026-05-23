import { Link } from "react-router-dom";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import type { DoctorCourse } from "../../../../api/doctorCoursesApi";

type Props = {
  course: DoctorCourse;
  sectionsCount?: number;
  projectsCount?: number;
  onManage?: () => void;
};

export function DoctorCourseCard({ course, sectionsCount, projectsCount, onManage }: Props) {
  const semesterLabel = course.semester?.trim() || "No semester set";
  const sectionsBadge =
    sectionsCount !== undefined
      ? `${sectionsCount} section${sectionsCount === 1 ? "" : "s"}`
      : course.sectionCount != null
        ? `${course.sectionCount} section${course.sectionCount === 1 ? "" : "s"}`
        : null;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-primary font-semibold">{course.code}</div>
            <Link
              to={`/courses/${course.courseId}`}
              className="font-semibold text-foreground hover:underline block truncate"
            >
              {course.name}
            </Link>
            <div className="text-xs text-muted-foreground mt-1">{semesterLabel}</div>
          </div>
          <Badge variant="outline" className="shrink-0">
            Owner
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {sectionsBadge ? <Badge variant="secondary">{sectionsBadge}</Badge> : null}
          {projectsCount !== undefined ? (
            <Badge variant="secondary">
              {projectsCount} project{projectsCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {course.useSharedProjectAcrossSections ? (
            <Badge variant="secondary">Shared project</Badge>
          ) : null}
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/courses/${course.courseId}`}>Open workspace</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/courses/${course.courseId}?tab=sections`}>Sections</Link>
          </Button>
          {onManage ? (
            <Button type="button" size="sm" variant="outline" onClick={onManage}>
              Manage
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
