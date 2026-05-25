import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Layers, GraduationCap, FolderGit2 } from "lucide-react";
import {
  getDoctorCourseById,
  getCourseSectionsCount,
  getCourseStudentsCount,
  getCourseProjectsCount,
} from "@/api/doctorCoursesApi";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { ROUTES } from "@/routes/paths";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

export default function DoctorCourseDetailPage() {
  const { courseId: idParam } = useParams<{ courseId: string }>();
  const courseId = Number(idParam);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState<string | null>(null);
  const [sections, setSections] = useState(0);
  const [students, setStudents] = useState(0);
  const [projects, setProjects] = useState(0);

  const load = useCallback(async () => {
    if (!Number.isFinite(courseId)) return;
    setLoading(true);
    try {
      const course = await getDoctorCourseById(courseId);
      setName(course.name);
      setCode(course.code);
      setSemester(course.semester);
      const [s, st, p] = await Promise.all([
        getCourseSectionsCount(courseId),
        getCourseStudentsCount(courseId),
        getCourseProjectsCount(courseId),
      ]);
      setSections(s);
      setStudents(st);
      setProjects(p);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load course",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-3xl mx-auto">
        <DoctorHubPageHeader
          title={name}
          description={`${code}${semester ? ` · ${semester}` : ""}`}
          backTo={ROUTES.doctorCourses}
          backLabel="Courses"
        />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard icon={<Layers className="h-4 w-4" />} label="Sections" value={sections} />
          <StatCard icon={<GraduationCap className="h-4 w-4" />} label="Students" value={students} />
          <StatCard icon={<FolderGit2 className="h-4 w-4" />} label="Projects" value={projects} />
        </div>
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-white p-4">
          Full section, enrollment, and project team management is available through existing{" "}
          <code className="text-xs">/api/courses/{courseId}/…</code> endpoints. A dedicated course
          workspace UI can be expanded in a follow-up without new list APIs.
        </p>
        <Link
          to={ROUTES.doctorCourses}
          className="inline-block mt-4 text-sm font-semibold text-primary hover:underline"
        >
          All courses
        </Link>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 text-center shadow-card">
      <div className="flex justify-center text-primary mb-1">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
