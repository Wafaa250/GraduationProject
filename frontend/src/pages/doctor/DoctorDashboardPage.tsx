import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/doctor/hub/MetricCard";
import { RequestCard } from "@/components/doctor/hub/RequestCard";
import { ProjectCard } from "@/components/doctor/hub/ProjectCard";
import { CourseCard } from "@/components/doctor/hub/CourseCard";
import { DoctorHubSectionEmpty } from "@/components/doctor/hub/DoctorHubSectionEmpty";
import { RequestDetailDialog } from "@/components/doctor/hub/RequestDetailDialog";
import { DOCTOR_HUB_METRIC_SLOTS } from "@/lib/doctorHubConfig";
import {
  acceptSupervisorRequest,
  getDoctorDashboardSummary,
  getDoctorSupervisedProjects,
  getDoctorSupervisorRequests,
  rejectSupervisorRequest,
  resignDoctorSupervision,
  parseApiErrorMessage,
  type DoctorDashboardSummary,
  type DoctorSupervisedProject,
  type DoctorSupervisorRequest,
} from "@/api/doctorDashboardApi";
import { getDoctorCoursesWithStats } from "@/api/doctorCoursesApi";
import { getConversations, sumConversationUnseen } from "@/api/conversationsApi";
import {
  countUniqueSupervisedStudents,
  mapCourseToCard,
  mapSupervisedProjectToCard,
  mapSupervisorRequestToCard,
} from "@/lib/doctorHubMappers";
import type { DoctorCourseWithStats } from "@/api/doctorCoursesApi";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Activity,
  BookOpen,
  Users,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";

const iconMap = { FileText, Activity, BookOpen, Users, MessageSquare } as const;

export default function DoctorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DoctorDashboardSummary | null>(null);
  const [requests, setRequests] = useState<DoctorSupervisorRequest[]>([]);
  const [projects, setProjects] = useState<DoctorSupervisedProject[]>([]);
  const [courses, setCourses] = useState<DoctorCourseWithStats[]>([]);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [resigningId, setResigningId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, requestsRes, projectsRes, coursesRes, conversationsRes] =
        await Promise.all([
          getDoctorDashboardSummary(),
          getDoctorSupervisorRequests(),
          getDoctorSupervisedProjects(),
          getDoctorCoursesWithStats(),
          getConversations(),
        ]);
      setSummary(summaryRes);
      setRequests(requestsRes);
      setProjects(projectsRes);
      setCourses(coursesRes);
      setMessagesUnread(sumConversationUnseen(conversationsRes));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load dashboard",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const supervisedStudentCount = useMemo(
    () => countUniqueSupervisedStudents(projects),
    [projects],
  );

  const metricValues = useMemo(() => {
    const s = summary;
    return {
      pending: s?.pendingRequestsCount ?? 0,
      active: s?.supervisedCount ?? 0,
      courses: courses.length,
      students: supervisedStudentCount,
      messages: messagesUnread,
    };
  }, [summary, courses.length, supervisedStudentCount, messagesUnread]);

  const requestCards = useMemo(() => requests.map(mapSupervisorRequestToCard), [requests]);
  const projectCards = useMemo(() => projects.map(mapSupervisedProjectToCard), [projects]);
  const courseCards = useMemo(
    () => courses.map((c, i) => mapCourseToCard(c, i)),
    [courses],
  );

  const detailRequest = useMemo(
    () => requests.find((r) => r.requestId === detailId) ?? null,
    [requests, detailId],
  );

  const handleAccept = async (requestId: number) => {
    setBusyRequestId(requestId);
    try {
      await acceptSupervisorRequest(requestId);
      toast({ title: "Request accepted", description: "You are now the project supervisor." });
      await loadDashboard();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Accept failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setBusyRequestId(requestId);
    try {
      await rejectSupervisorRequest(requestId);
      toast({ title: "Request rejected" });
      await loadDashboard();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Reject failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleResign = async (projectId: number) => {
    if (!confirm("Resign supervision for this project?")) return;
    setResigningId(projectId);
    try {
      await resignDoctorSupervision(projectId);
      toast({ title: "Supervision ended" });
      await loadDashboard();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Resign failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setResigningId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 bg-gradient-mesh flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading dashboard" />
      </main>
    );
  }

  const pendingCancel = summary?.pendingCancelCount ?? 0;

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 space-y-6 max-w-[1600px] mx-auto">
        {pendingCancel > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{pendingCancel}</span> supervision cancellation
              request{pendingCancel === 1 ? "" : "s"} need your review.
            </p>
            <Link
              to={ROUTES.doctorRequests}
              className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:gap-2"
            >
              Review <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {DOCTOR_HUB_METRIC_SLOTS.map((slot) => {
              const Icon = iconMap[slot.icon];
              const value = metricValues[slot.key as keyof typeof metricValues] ?? 0;
              return (
                <MetricCard
                  key={slot.key}
                  label={slot.label}
                  value={value}
                  sub={slot.subLabel}
                  tone={slot.tone}
                  icon={Icon}
                  empty={false}
                />
              );
            })}
          </div>
        </section>

        <section id="doctor-requests-section" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-display text-[18px] font-bold text-foreground">
                Recent Supervision Requests
              </h2>
              <p className="text-[12.5px] text-muted-foreground">
                Students proposing graduation projects under your mentorship
              </p>
            </div>
            <Link
              to={ROUTES.doctorRequests}
              className="text-[12.5px] font-semibold text-primary inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {requestCards.length > 0 ? (
            <div className="space-y-3">
              {requestCards.slice(0, 5).map((r) => (
                <RequestCard
                  key={r.id}
                  r={r}
                  busyRequestId={busyRequestId}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onDetails={setDetailId}
                />
              ))}
            </div>
          ) : (
            <DoctorHubSectionEmpty message="No supervision requests yet. Incoming student proposals will be listed here." />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-[18px] font-bold text-foreground">Active Projects</h2>
              <p className="text-[12.5px] text-muted-foreground">
                Ongoing graduation projects you supervise
              </p>
            </div>
            <Link
              to={ROUTES.doctorProjects}
              className="text-[12.5px] font-semibold text-primary inline-flex items-center gap-1"
            >
              View all {projects.length > 0 ? projects.length : ""}{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {projectCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectCards.slice(0, 4).map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  onResign={handleResign}
                  resigning={resigningId === Number(p.id)}
                />
              ))}
            </div>
          ) : (
            <DoctorHubSectionEmpty
              message="No active projects yet. Supervised graduation projects will appear here."
              minHeight="min-h-[200px]"
            />
          )}
        </section>

        <section className="pb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-[18px] font-bold text-foreground">Courses Overview</h2>
              <p className="text-[12.5px] text-muted-foreground">
                {courses.some((c) => c.semester)
                  ? courses.find((c) => c.semester)?.semester ?? "Your teaching load"
                  : "Your teaching load"}
              </p>
            </div>
            <Link
              to={ROUTES.doctorCourses}
              className="text-[12.5px] font-semibold text-primary inline-flex items-center gap-1"
            >
              Manage courses <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {courseCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {courseCards.map((c) => (
                <CourseCard key={c.code} c={c} />
              ))}
            </div>
          ) : (
            <DoctorHubSectionEmpty
              message="No courses to display yet. Your course sections will be listed here."
              minHeight="min-h-[160px]"
            />
          )}
        </section>
      </div>

      <RequestDetailDialog
        request={detailRequest}
        open={detailId != null}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </main>
  );
}
