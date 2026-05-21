import type { ReactNode } from "react";

import { StudentDashboardShell } from "../../dashboard/components/StudentDashboardShell";
import { useStudentDashboardShellProps } from "../../dashboard/hooks/useStudentDashboardShellProps";
import { CourseHubBackLink } from "./courseHub/CourseHubBackLink";
import { CourseHubPageHeader } from "./courseHub/CourseHubPageHeader";

export type StudentCourseSubpageShellProps = {
  backTo: string;
  backLabel?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
};

export function StudentCourseSubpageShell({
  backTo,
  backLabel = "Back",
  eyebrow,
  title,
  description,
  headerActions,
  children,
  maxWidthClass = "max-w-5xl",
}: StudentCourseSubpageShellProps) {
  const shellProps = useStudentDashboardShellProps();

  return (
    <StudentDashboardShell {...shellProps}>
      <div className={maxWidthClass}>
        <CourseHubBackLink to={backTo}>{backLabel}</CourseHubBackLink>
        <CourseHubPageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={headerActions}
        />
        {children}
      </div>
    </StudentDashboardShell>
  );
}
