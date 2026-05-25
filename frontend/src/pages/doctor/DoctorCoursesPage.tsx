import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getDoctorCoursesWithStats } from "@/api/doctorCoursesApi";
import { mapCourseToCard } from "@/lib/doctorHubMappers";
import { CourseCard } from "@/components/doctor/hub/CourseCard";
import { DoctorHubSectionEmpty } from "@/components/doctor/hub/DoctorHubSectionEmpty";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

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
        <DoctorHubPageHeader
          title="Courses"
          description="Your teaching load and course workspaces"
        />
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
          Course creation and team management use existing course APIs from the course detail
          page.
        </p>
      </div>
    </main>
  );
}
