import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getStudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { DoctorStudentProfileView } from "@/components/doctor/student-profile/DoctorStudentProfileView";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { ROUTES } from "@/routes/paths";
import "@/styles/doctor-student-profile.css";

export default function StudentDirectoryProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudentDirectoryProfile>> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

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
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
      <Link
        to={ROUTES.communicationHub}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !student ? (
        <p className="text-sm text-muted-foreground">{error ?? "Student not found."}</p>
      ) : (
        <DoctorStudentProfileView
          student={student}
          graduationProjects={[]}
          courseTeams={[]}
          enrollmentCount={0}
        />
      )}
    </div>
  );
}
