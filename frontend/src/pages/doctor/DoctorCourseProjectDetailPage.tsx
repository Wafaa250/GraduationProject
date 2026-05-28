import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ROUTES, doctorCoursePath, doctorSectionPath } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import { useCourseProjectWorkspace } from "@/hooks/useCourseProjectWorkspace";
import { CourseProjectWorkspaceHero } from "@/components/doctor/course-project-workspace/CourseProjectWorkspaceHero";
import { CourseProjectWorkspaceTabs } from "@/components/doctor/course-project-workspace/CourseProjectWorkspaceTabs";

export default function DoctorCourseProjectDetailPage() {
  const { courseId: courseIdParam, sectionId: sectionIdParam, projectId: projectIdParam } =
    useParams<{ courseId: string; sectionId: string; projectId: string }>();
  const courseId = Number(courseIdParam);
  const sectionId = Number(sectionIdParam);
  const projectId = Number(projectIdParam);

  const { workspace, bundle, pageLoading, bundleLoading, error, projectMissing, reload } =
    useCourseProjectWorkspace(courseId, sectionId, projectId);

  useEffect(() => {
    if (!error) return;
    toast({
      variant: "destructive",
      title: "Could not load project workspace",
      description: error,
    });
  }, [error]);

  if (!Number.isFinite(courseId) || !Number.isFinite(sectionId) || !Number.isFinite(projectId)) {
    return <Navigate to={ROUTES.doctorCourses} replace />;
  }

  if (pageLoading) {
    return (
      <main className="min-h-full flex-1 bg-gradient-mesh">
        <div className="mx-auto max-w-7xl space-y-5 px-5 py-6 lg:px-8 lg:py-8">
          <div className="h-4 w-64 animate-pulse rounded bg-secondary" />
          <div className="h-[72px] animate-pulse rounded-xl border border-border/60 bg-card" />
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </main>
    );
  }

  if (projectMissing) {
    return (
      <main className="min-h-full flex-1 bg-gradient-mesh">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <p className="text-sm text-muted-foreground">Project not found in this section.</p>
          <Link
            to={doctorSectionPath(courseId, sectionId)}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to section
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex-1 bg-gradient-mesh">
      <div className="mx-auto max-w-7xl space-y-5 px-5 py-6 lg:px-8 lg:py-8">
        <nav className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <Link to={ROUTES.doctorCourses} className="transition-colors hover:text-primary">
            Courses
          </Link>
          <span>/</span>
          <Link to={doctorCoursePath(courseId)} className="truncate transition-colors hover:text-primary">
            {workspace.courseName || "Course"}
          </Link>
          <span>/</span>
          <Link
            to={doctorSectionPath(courseId, sectionId)}
            className="truncate transition-colors hover:text-primary"
          >
            {workspace.sectionName}
          </Link>
          <span>/</span>
          <span className="truncate text-foreground">{workspace.projectTitle}</span>
        </nav>

        <CourseProjectWorkspaceHero workspace={workspace} />
        <CourseProjectWorkspaceTabs
          workspace={workspace}
          bundle={bundle}
          bundleLoading={bundleLoading}
          onReload={() => void reload()}
        />
      </div>
    </main>
  );
}
