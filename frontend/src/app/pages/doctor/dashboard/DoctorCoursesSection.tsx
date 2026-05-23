import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, PlusCircle } from "lucide-react";
import { parseApiErrorMessage } from "../../../../api/axiosInstance";
import {
  createDoctorCourse,
  getDoctorCourseProjects,
  getDoctorCourseSections,
  getDoctorMyCourses,
  type DoctorCourse,
} from "../../../../api/doctorCoursesApi";
import { useToast } from "../../../../context/ToastContext";
import { DoctorHubEmptyState } from "../../../components/doctor/hub/DoctorHubEmptyState";
import { DoctorHubPageHeader } from "../../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorCourseCard } from "../../../components/doctor/courses/DoctorCourseCard";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Skeleton } from "../../../components/ui/skeleton";
import { DoctorCourseManagePanel } from "./DoctorCourseManagePanel";

type CourseMeta = {
  sectionsCount?: number;
  projectsCount?: number;
};

export function DoctorCoursesSection() {
  const { showToast } = useToast();

  const [courses, setCourses] = useState<DoctorCourse[]>([]);
  const [metaByCourseId, setMetaByCourseId] = useState<Record<number, CourseMeta>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [manageCourseId, setManageCourseId] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", semester: "" });
  const [creating, setCreating] = useState(false);

  const enrichCourseMeta = useCallback(async (list: DoctorCourse[]) => {
    if (list.length === 0) {
      setMetaByCourseId({});
      return;
    }
    const entries = await Promise.all(
      list.map(async (c) => {
        const meta: CourseMeta = {};
        try {
          const sections = await getDoctorCourseSections(c.courseId);
          meta.sectionsCount = sections.length;
        } catch {
          meta.sectionsCount = c.sectionCount;
        }
        try {
          const projects = await getDoctorCourseProjects(c.courseId);
          meta.projectsCount = projects.length;
        } catch {
          /* optional badge */
        }
        return [c.courseId, meta] as const;
      }),
    );
    setMetaByCourseId(Object.fromEntries(entries));
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getDoctorMyCourses();
      setCourses(data);
      void enrichCourseMeta(data);
    } catch (err) {
      setLoadError(parseApiErrorMessage(err));
      setCourses([]);
      setMetaByCourseId({});
    } finally {
      setLoading(false);
    }
  }, [enrichCourseMeta]);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const handleQuickCreate = async () => {
    const nameTrim = form.name.trim();
    const codeTrim = form.code.trim();
    if (!nameTrim || !codeTrim) {
      showToast("Please enter name and code.", "error");
      return;
    }
    setCreating(true);
    try {
      await createDoctorCourse({
        name: nameTrim,
        code: codeTrim,
        semester: form.semester.trim() || null,
        useSharedProjectAcrossSections: false,
        allowCrossSectionTeams: false,
      });
      showToast("Course created", "success");
      setDialogOpen(false);
      setForm({ name: "", code: "", semester: "" });
      await fetchCourses();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <DoctorHubPageHeader
        title="My Courses"
        description="Courses you own. Manage sections, students, projects, and teams from each workspace."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/courses/create">Advanced setup</Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create a new course</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="course-name">Name</Label>
                    <Input
                      id="course-name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Distributed Systems"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="course-code">Code</Label>
                    <Input
                      id="course-code"
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      placeholder="CS411"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="course-semester">Semester</Label>
                    <Input
                      id="course-semester"
                      value={form.semester}
                      onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                      placeholder="Fall 2026 (optional)"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => void handleQuickCreate()} disabled={creating}>
                    {creating ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {loading && courses.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : null}

      {!loading && loadError && courses.length === 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 mb-4">
          {loadError}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchCourses()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!loading && !loadError && courses.length === 0 ? (
        <DoctorHubEmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start adding sections, enrolling students, and forming teams."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create first course
            </Button>
          }
        />
      ) : null}

      {courses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <DoctorCourseCard
              key={course.courseId}
              course={course}
              sectionsCount={metaByCourseId[course.courseId]?.sectionsCount}
              projectsCount={metaByCourseId[course.courseId]?.projectsCount}
              onManage={() => setManageCourseId(course.courseId)}
            />
          ))}
        </div>
      ) : null}

      <DoctorCourseManagePanel
        open={manageCourseId != null}
        courseId={manageCourseId}
        onClose={() => {
          setManageCourseId(null);
          void fetchCourses();
        }}
      />
    </div>
  );
}
