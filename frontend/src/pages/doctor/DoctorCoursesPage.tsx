import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { getDoctorCoursesWithStats } from "@/api/doctorCoursesApi";
import { mapCourseToCard } from "@/lib/doctorHubMappers";
import { CourseCard } from "@/components/doctor/hub/CourseCard";
import { DoctorHubSectionEmpty } from "@/components/doctor/hub/DoctorHubSectionEmpty";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/routes/paths";

export default function DoctorCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<ReturnType<typeof mapCourseToCard>[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getDoctorCoursesWithStats();
      setCourses(rows.map((c, i) => mapCourseToCard(c, i)));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load courses",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <DoctorHubPageHeader
            title="Courses"
            description="Your teaching load and course workspaces"
            className="mb-0"
          />
          <Link
            to={ROUTES.doctorCreateCourse}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow no-underline transition-smooth hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : courses.length === 0 ? (
          <DoctorHubSectionEmpty message="No courses yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <CourseCard key={c.code} c={c} />
            ))}
          </div>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          Team management and sections are configured from each course workspace after creation.
        </p>
      </div>
    </main>
  );
}
