import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import { useCourseWorkspace } from "@/hooks/useCourseWorkspace";
import { CourseWorkspaceHero } from "@/components/doctor/course-workspace/CourseWorkspaceHero";
import { CourseOverviewPanel } from "@/components/doctor/course-workspace/CourseOverviewPanel";

export default function DoctorCourseDetailPage() {
  const { courseId: idParam } = useParams<{ courseId: string }>();
  const courseId = Number(idParam);
  const { course, bundle, pageLoading, bundleLoading, error, reload } = useCourseWorkspace(courseId);

  useEffect(() => {
    if (!error) return;
    toast({
      variant: "destructive",
      title: "Could not load course workspace",
      description: error,
    });
  }, [error]);

  if (pageLoading) {
    return (
      <main className="min-h-full flex-1 bg-gradient-mesh">
        <div className="mx-auto max-w-7xl space-y-5 px-5 py-6 lg:px-8 lg:py-8">
          <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
          <div className="h-[72px] animate-pulse rounded-xl border border-border/60 bg-card" />
          <div className="space-y-3">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border border-border/60 bg-card" />
            ))}
          </div>
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex-1 bg-gradient-mesh">
      <div className="mx-auto max-w-7xl space-y-5 px-5 py-6 lg:px-8 lg:py-8">
        <nav className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Link to={ROUTES.doctorCourses} className="transition-colors hover:text-primary">
            Courses
          </Link>
          <span>/</span>
          <span className="truncate text-foreground">{course.name || "Course"}</span>
        </nav>

        <CourseWorkspaceHero course={course} />
        <CourseOverviewPanel
          course={course}
          bundle={bundle}
          bundleLoading={bundleLoading}
          onReload={() => void reload()}
        />
      </div>
    </main>
  );
}
