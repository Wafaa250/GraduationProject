import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, FolderKanban, Users, Megaphone, BookMarked, Loader2 } from "lucide-react";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getEnrolledCourses,
  getStudentCourseDetail,
  getCourseEnrollmentStudents,
  getStudentCourseProjects,
  getStudentCourseAnnouncements,
  getCourseProjectMyTeam,
  getManualTeamStudents,
  type EnrolledCourse,
} from "@/api/studentCoursesApi";
import { getMe } from "@/api/meApi";
import { listDoctorsDirectory } from "@/api/doctorDirectoryApi";
import { getDoctorPublicProfile } from "@/api/doctorPublicApi";
import { MetricCard } from "@/components/student/manage-courses/MetricCard";
import { CourseCard } from "@/components/student/manage-courses/CourseCard";
import { CourseDetail } from "@/components/student/manage-courses/CourseDetail";
import { EmptyState } from "@/components/student/manage-courses/EmptyState";
import {
  mapEnrolledToCard,
  mapDetailToModel,
  mapClassmates,
  mapProjects,
  countSectionStudents,
  buildClassmateTeamStatusMap,
  buildCourseOverviewSummary,
  type ManageCourseCardModel,
  type ManageCourseDetailModel,
  type CourseOverviewSummary,
} from "@/lib/studentManageCourses";
import { filterEligibleCourseProjects } from "@/lib/courseProjectEligibility";
import { ROUTES, studentCoursePath } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import "@/styles/student-manage-courses.css";

type CourseListStats = Record<
  number,
  { students: number; projects: number; announcements: number }
>;

export default function StudentManageCoursesPage() {
  const navigate = useNavigate();
  const { courseId: courseIdParam } = useParams<{ courseId?: string }>();
  const selectedCourseId = courseIdParam ? Number(courseIdParam) : null;
  const hasValidSelection =
    selectedCourseId != null && Number.isFinite(selectedCourseId) && selectedCourseId > 0;

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [listStats, setListStats] = useState<CourseListStats>({});
  const [cards, setCards] = useState<ManageCourseCardModel[]>([]);
  const [semesterHint, setSemesterHint] = useState<string>("");
  const [myProfileId, setMyProfileId] = useState<number | null>(null);

  const [detailCourse, setDetailCourse] = useState<ManageCourseDetailModel | null>(null);
  const [detailProjects, setDetailProjects] = useState<ReturnType<typeof mapProjects>>([]);
  const [detailClassmates, setDetailClassmates] = useState<ReturnType<typeof mapClassmates>>([]);
  const [detailAnnouncements, setDetailAnnouncements] = useState<
    { id: number; title: string; message: string; doctor: string; date: string }[]
  >([]);
  const [detailOverview, setDetailOverview] = useState<CourseOverviewSummary | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const [courses, me] = await Promise.all([getEnrolledCourses(), getMe()]);
      setMyProfileId(me.profileId ?? null);
      setEnrolled(courses);

      const semesters = [
        ...new Set(courses.map((c) => c.semester?.trim()).filter(Boolean) as string[]),
      ];
      setSemesterHint(semesters.length === 1 ? semesters[0] : semesters.length > 1 ? "Current term" : "");

      const stats: CourseListStats = {};

      const cardModels = await Promise.all(
        courses.map(async (course, index) => {
          try {
            const [detail, students, allProjects] = await Promise.all([
              getStudentCourseDetail(course.courseId),
              getCourseEnrollmentStudents(course.courseId),
              getStudentCourseProjects(course.courseId),
            ]);
            const projects = filterEligibleCourseProjects(allProjects, detail.mySectionId);
            const sectionStudents = countSectionStudents(students, detail.mySectionId);
            const projectIds = projects.map((p) => p.id);
            const announcements = await getStudentCourseAnnouncements(
              projectIds,
              course.doctorName,
            );
            stats[course.courseId] = {
              students: sectionStudents,
              projects: projects.length,
              announcements: announcements.length,
            };
            return mapEnrolledToCard(course, index, stats[course.courseId], detail);
          } catch {
            stats[course.courseId] = { students: 0, projects: 0, announcements: 0 };
            return mapEnrolledToCard(course, index, stats[course.courseId]);
          }
        }),
      );

      setListStats(stats);
      setCards(cardModels);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load courses",
        description: parseApiErrorMessage(err),
      });
      setEnrolled([]);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (courseId: number) => {
      setDetailLoading(true);
      try {
        const enrollment = enrolled.find((c) => c.courseId === courseId);
        if (!enrollment) {
          navigate(ROUTES.studentCourses, { replace: true });
          return;
        }

        const index = enrolled.findIndex((c) => c.courseId === courseId);
        const [detail, students, allProjects, doctors] = await Promise.all([
          getStudentCourseDetail(courseId),
          getCourseEnrollmentStudents(courseId),
          getStudentCourseProjects(courseId),
          listDoctorsDirectory(),
        ]);
        const projects = filterEligibleCourseProjects(allProjects, detail.mySectionId);

        let doctorTitle = "Instructor";
        let officeHours = "";
        let description = buildCourseDescriptionFromDetail(detail);

        const directoryEntry = doctors.find((d) => d.profileId === detail.doctorId);
        if (directoryEntry) {
          doctorTitle = directoryEntry.specialization?.trim() || doctorTitle;
          try {
            const profile = await getDoctorPublicProfile(directoryEntry.userId);
            doctorTitle =
              profile.doctorProfile.specialization?.trim() || doctorTitle;
            officeHours = profile.doctorProfile.officeHours?.trim() || "";
            description = buildCourseDescriptionFromDetail(
              detail,
              profile.doctorProfile.bio,
            );
          } catch {
            /* optional enrichment */
          }
        }

        const baseCard =
          cards[index] ??
          mapEnrolledToCard(
            enrollment,
            index >= 0 ? index : 0,
            listStats[courseId] ?? {
              students: countSectionStudents(students, detail.mySectionId),
              projects: projects.length,
              announcements: 0,
            },
            detail,
            doctorTitle,
          );

        const model = mapDetailToModel(
          { ...baseCard, doctorTitle, description },
          detail,
          officeHours,
        );
        model.students = countSectionStudents(students, detail.mySectionId);
        model.projects = projects.length;

        const projectIds = projects.map((p) => p.id);
        const announcements = await getStudentCourseAnnouncements(
          projectIds,
          detail.doctorName,
        );

        const sectionPeers = students.filter(
          (s) => s.sectionId === detail.mySectionId && s.studentId !== myProfileId,
        );
        const teamStatusByStudentId = await buildClassmateTeamStatusMap(
          courseId,
          projects,
          sectionPeers.map((s) => s.studentId),
          myProfileId,
          {
            getMyTeam: getCourseProjectMyTeam,
            getManualStudents: getManualTeamStudents,
          },
        );

        const mappedProjects = mapProjects(courseId, projects);
        const mappedClassmates = mapClassmates(
          courseId,
          students,
          detail.mySectionId,
          myProfileId,
          teamStatusByStudentId,
        );

        setDetailCourse(model);
        setDetailProjects(mappedProjects);
        setDetailClassmates(mappedClassmates);
        setDetailAnnouncements(announcements);
        setDetailOverview(
          buildCourseOverviewSummary(mappedClassmates, mappedProjects, announcements),
        );
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Could not load course",
          description: parseApiErrorMessage(err),
        });
        navigate(ROUTES.studentCourses, { replace: true });
      } finally {
        setDetailLoading(false);
      }
    },
    [enrolled, cards, listStats, myProfileId, navigate],
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!hasValidSelection || loading) return;
    if (enrolled.length === 0) {
      navigate(ROUTES.studentCourses, { replace: true });
      return;
    }
    void loadDetail(selectedCourseId);
  }, [hasValidSelection, selectedCourseId, loading, enrolled.length, loadDetail, navigate]);

  const totals = useMemo(() => {
    let projects = 0;
    let announcements = 0;

    for (const course of enrolled) {
      const s = listStats[course.courseId];
      if (s) {
        projects += s.projects;
        announcements += s.announcements;
      }
    }

    return {
      courses: enrolled.length,
      projects,
      classmates: cards.reduce((sum, c) => sum + c.students, 0),
      announcements,
    };
  }, [enrolled, listStats, cards]);

  const handleOpenCourse = (courseId: number) => {
    navigate(studentCoursePath(courseId));
  };

  const handleBack = () => {
    navigate(ROUTES.studentCourses);
  };

  if (loading) {
    return (
      <div className="student-manage-courses student-hub min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading courses" />
      </div>
    );
  }

  if (hasValidSelection) {
    if (detailLoading || !detailCourse) {
      return (
        <div className="student-manage-courses student-hub min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading course" />
        </div>
      );
    }

    return (
      <div className="student-manage-courses student-hub min-h-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <CourseDetail
            course={detailCourse}
            projects={detailProjects}
            classmates={detailClassmates}
            announcements={detailAnnouncements}
            overview={detailOverview}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="student-manage-courses student-hub min-h-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
              <BookMarked className="h-3.5 w-3.5" /> Academic Workspace
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-bold tracking-tight">
              Manage My Courses
            </h1>
            <p className="mt-1.5 text-muted-foreground max-w-2xl">
              View your enrolled courses, sections, classmates, projects, and course updates.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Enrolled Courses"
            value={totals.courses}
            hint={semesterHint || undefined}
            icon={BookOpen}
            tone="primary"
          />
          <MetricCard
            label="Active Course Projects"
            value={totals.projects}
            hint="Across all courses"
            icon={FolderKanban}
            tone="info"
          />
          <MetricCard
            label="Classmates"
            value={totals.classmates}
            hint="In your sections"
            icon={Users}
            tone="success"
          />
          <MetricCard
            label="Announcements"
            value={totals.announcements}
            hint="Course updates"
            icon={Megaphone}
            tone="warning"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold">Your courses</h2>
              <p className="text-sm text-muted-foreground">
                All courses you&apos;re enrolled in this semester.
              </p>
            </div>
          </div>

          {cards.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="You aren't enrolled in any courses for this semester. Once registration is complete, your courses will show up here."
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {cards.map((c) => (
                <CourseCard key={c.id} course={c} onOpen={handleOpenCourse} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function buildCourseDescriptionFromDetail(
  detail: { name: string; code: string; semester?: string | null },
  bio?: string | null,
): string {
  const trimmed = bio?.trim();
  if (trimmed) return trimmed;
  const semester = detail.semester?.trim();
  if (semester) return `${detail.name} (${detail.code}) — ${semester}.`;
  return `${detail.name} (${detail.code}).`;
}
