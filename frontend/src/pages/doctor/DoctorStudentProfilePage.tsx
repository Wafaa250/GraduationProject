import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getStudentDirectoryProfile } from "@/api/studentDirectoryApi";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { ROUTES } from "@/routes/paths";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

export default function DoctorStudentProfilePage() {
  const { userId: idParam } = useParams<{ userId: string }>();
  const userId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudentDirectoryProfile>> | null>(
    null,
  );

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

  const photo = student.profilePictureBase64?.trim();
  const photoSrc = photo ? (photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`) : null;

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-3xl mx-auto">
        <DoctorHubPageHeader
          title={student.name}
          description={`${student.major || "—"}${student.academicYear ? ` · ${student.academicYear}` : ""}`}
          backTo={ROUTES.doctorDashboard}
          backLabel="Dashboard"
        />
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-5">
          <div className="flex items-start gap-4">
            {photoSrc ? (
              <img src={photoSrc} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-primary grid place-items-center text-lg font-bold text-primary-foreground">
                {student.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <p className="text-sm text-muted-foreground">{student.university}</p>
              {student.studentId && (
                <p className="text-xs text-muted-foreground mt-1">ID: {student.studentId}</p>
              )}
            </div>
          </div>
          {student.bio && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Bio</h3>
              <p className="text-sm text-foreground">{student.bio}</p>
            </div>
          )}
          {student.technicalSkills.length > 0 && (
            <SkillBlock label="Technical skills" items={student.technicalSkills} />
          )}
          {student.roles.length > 0 && <SkillBlock label="Roles" items={student.roles} />}
          {student.tools.length > 0 && <SkillBlock label="Tools" items={student.tools} />}
        </div>
      </div>
    </main>
  );
}

function SkillBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{label}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span
            key={s}
            className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
