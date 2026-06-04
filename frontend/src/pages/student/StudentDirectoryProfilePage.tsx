import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getStudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { DoctorStudentProfileView } from "@/components/doctor/student-profile/DoctorStudentProfileView";
import { useDoctorStudentProfileExtras } from "@/hooks/useDoctorStudentProfileExtras";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { ROUTES } from "@/routes/paths";
import "@/styles/doctor-student-profile.css";
import "@/styles/student-workspace-pages.css";

export default function StudentDirectoryProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudentDirectoryProfile>> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const extras = useDoctorStudentProfileExtras(student?.profileId ?? null, student?.userId ?? null);

  useEffect(() => {
    if (!Number.isFinite(userId)) return;
    setLoading(true);
    setError(null);
    void getStudentDirectoryProfile(userId)
      .then(setStudent)
      .catch((err) => {
        setStudent(null);
        setError(parseApiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="student-hub student-workspace-page min-h-full bg-hero">
      <div className="mx-auto w-full max-w-[72rem] px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to={ROUTES.communicationHub}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Communication Hub
        </Link>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          </div>
        ) : !student ? (
          <p className="text-sm text-muted-foreground">{error ?? "Student not found."}</p>
        ) : (
          <DoctorStudentProfileView
            student={student}
            graduationProjects={extras.graduationProjects}
            courseTeams={extras.courseTeams}
            enrollmentCount={extras.enrollmentCount}
            extrasLoading={extras.loading}
          />
        )}
      </div>
    </div>
  );
}
