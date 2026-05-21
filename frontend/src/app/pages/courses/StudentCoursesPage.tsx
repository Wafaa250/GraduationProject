import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import { getEnrolledCourses, type EnrolledCourse } from "../../../api/studentCoursesApi";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { useStudentDashboardShellProps } from "../dashboard/hooks/useStudentDashboardShellProps";
import { StudentCourseDetailView } from "./components/StudentCourseDetailView";
import { StudentCoursesHubView } from "./components/StudentCoursesHubView";

export default function StudentCoursesPage() {
    const { courseId } = useParams<{ courseId?: string }>();
    const routeCourseId = courseId && /^\d+$/.test(courseId) ? Number(courseId) : null;
  const shellProps = useStudentDashboardShellProps();

    const [user, setUser] = useState<unknown>(null);
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setCoursesLoading(true);
            setCoursesError(null);
            try {
                const [meRes, enrolled] = await Promise.all([api.get("/me"), getEnrolledCourses()]);
                if (cancelled) return;
                setUser(meRes.data);
                setCourses(enrolled);
            } catch (err) {
                if (cancelled) return;
                setCoursesError(parseApiErrorMessage(err));
            } finally {
                if (!cancelled) setCoursesLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

        return (
    <StudentDashboardShell {...shellProps}>
      {routeCourseId != null ? (
        <StudentCourseDetailView courseId={routeCourseId} user={user} />
      ) : (
        <StudentCoursesHubView courses={courses} loading={coursesLoading} error={coursesError} />
      )}
    </StudentDashboardShell>
  );
}
