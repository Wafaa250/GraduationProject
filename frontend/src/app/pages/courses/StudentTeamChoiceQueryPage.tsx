import { Navigate, useParams, useSearchParams } from "react-router-dom";

import StudentTeamGenerationChoicePage from "./StudentTeamGenerationChoicePage";

/**
 * Hub route: /student/courses/:courseId/team-choice?projectId=
 * Redirects to canonical nested path when possible; otherwise renders choice UI with query param.
 */
export default function StudentTeamChoiceQueryPage() {
  const { courseId } = useParams<{ courseId?: string }>();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId")?.trim() ?? "";

  if (courseId && projectId && /^\d+$/.test(courseId) && /^\d+$/.test(projectId)) {
    return (
      <Navigate
        to={`/student/courses/${courseId}/projects/${projectId}/team-choice`}
        replace
      />
    );
  }

  return <StudentTeamGenerationChoicePage />;
}
