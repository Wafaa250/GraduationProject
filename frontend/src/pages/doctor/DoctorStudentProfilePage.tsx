import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getStudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { DoctorStudentProfileView } from "@/components/doctor/student-profile/DoctorStudentProfileView";
import { useDoctorStudentProfileExtras } from "@/hooks/useDoctorStudentProfileExtras";
import { ROUTES } from "@/routes/paths";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import "@/styles/doctor-student-profile.css";

export default function DoctorStudentProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudentDirectoryProfile>> | null>(
    null,
  );

  const extras = useDoctorStudentProfileExtras(student?.profileId ?? null, student?.userId ?? null);

  useEffect(() => {
    if (!Number.isFinite(userId)) return;
    setLoading(true);
    void getStudentDirectoryProfile(userId)
      .then(setStudent)
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Could not load student",
          description: parseApiErrorMessage(err),
        });
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  if (!student) {
    return (
      <main className="flex-1 bg-gradient-mesh px-5 lg:px-8 py-5">
        <DoctorHubPageHeader title="Student" backTo={ROUTES.doctorDashboard} />
        <p className="text-sm text-muted-foreground">Student not found.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5">
        <DoctorHubPageHeader
          title="Student profile"
          description="View skills, academic details, and course team memberships"
          backTo={ROUTES.doctorDashboard}
          backLabel="Dashboard"
        />
        <DoctorStudentProfileView
          student={student}
          graduationProjects={extras.graduationProjects}
          courseTeams={extras.courseTeams}
          enrollmentCount={extras.enrollmentCount}
          extrasLoading={extras.loading}
        />
      </div>
    </main>
  );
}
