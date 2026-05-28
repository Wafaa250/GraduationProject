import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ROUTES, doctorCoursePath } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import { useSectionWorkspace } from "@/hooks/useSectionWorkspace";
import { SectionWorkspaceHero } from "@/components/doctor/course-workspace/SectionWorkspaceHero";
import { SectionWorkspaceTabs } from "@/components/doctor/course-workspace/SectionWorkspaceTabs";

export default function DoctorSectionDetailPage() {
  const { courseId: courseIdParam, sectionId: sectionIdParam } = useParams<{
    courseId: string;
    sectionId: string;
  }>();
  const courseId = Number(courseIdParam);
  const sectionId = Number(sectionIdParam);

  const { section, sectionBundle, pageLoading, bundleLoading, error, sectionMissing, reload } =
    useSectionWorkspace(courseId, sectionId);

  useEffect(() => {
    if (!error) return;
    toast({
      variant: "destructive",
      title: "Could not load section workspace",
      description: error,
    });
  }, [error]);

  if (!Number.isFinite(courseId) || !Number.isFinite(sectionId)) {
    return <Navigate to={ROUTES.doctorCourses} replace />;
  }

  if (pageLoading) {
    return (
      <main className="min-h-full flex-1 bg-gradient-mesh">
        <div className="mx-auto max-w-7xl space-y-5 px-5 py-6 lg:px-8 lg:py-8">
          <div className="h-4 w-56 animate-pulse rounded bg-secondary" />
          <div className="h-[72px] animate-pulse rounded-xl border border-border/60 bg-card" />
          <div className="flex gap-4 border-b border-border/60 pb-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded bg-secondary" />
            ))}
          </div>
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </main>
    );
  }

  if (sectionMissing) {
    return (
      <main className="min-h-full flex-1 bg-gradient-mesh">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <p className="text-sm text-muted-foreground">Section not found in this course.</p>
          <Link to={doctorCoursePath(courseId)} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Back to course
          </Link>
        </div>
      </main>
    );
  }

  if (!section) return null;

  return (
    <main className="min-h-full flex-1 bg-gradient-mesh">
      <div className="mx-auto max-w-7xl space-y-5 px-5 py-6 lg:px-8 lg:py-8">
        <nav className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <Link to={ROUTES.doctorCourses} className="transition-colors hover:text-primary">
            Courses
          </Link>
          <span>/</span>
          <Link to={doctorCoursePath(courseId)} className="truncate transition-colors hover:text-primary">
            {section.courseName || "Course"}
          </Link>
          <span>/</span>
          <span className="truncate text-foreground">{section.sectionName}</span>
        </nav>

        <SectionWorkspaceHero section={section} />
        <SectionWorkspaceTabs
          section={section}
          bundle={sectionBundle}
          bundleLoading={bundleLoading}
          onReload={() => void reload()}
        />
      </div>
    </main>
  );
}
