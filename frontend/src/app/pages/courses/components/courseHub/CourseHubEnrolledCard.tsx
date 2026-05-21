import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";

import type { EnrolledCourse } from "../../../../../api/studentCoursesApi";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import {
  formatEnrolledSemester,
  getEnrolledSectionLabel,
} from "../studentCourseHelpers";

/** Matches Lovable student-course-hub CoursesHub card markup. */
export function CourseHubEnrolledCard({
  course,
  courseId,
}: {
  course: EnrolledCourse;
  courseId: number;
}) {
  const semester = formatEnrolledSemester(course.semester);
  const sectionLabel = getEnrolledSectionLabel(course);

  return (
    <Link
      to={`/student/courses/${courseId}`}
      className="group block focus:outline-none"
    >
      <Card className="relative h-full overflow-hidden rounded-2xl border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant focus-visible:ring-2 focus-visible:ring-primary">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-gradient-primary opacity-10 blur-3xl transition-opacity group-hover:opacity-30" />
        <div className="relative space-y-5">
          <div className="flex items-start justify-between gap-3">
            <Badge
              variant="outline"
              className="course-hub-chip border-0 font-mono"
            >
              {course.code?.trim() || "—"}
            </Badge>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {semester || "\u00a0"}
            </span>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold leading-tight text-foreground">
              {course.name?.trim() || "Course"}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              {course.doctorName?.trim() || "Doctor"}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Badge
              variant="outline"
              className="rounded-md border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {sectionLabel}
            </Badge>
            <span className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
