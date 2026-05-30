import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Users,
} from "lucide-react";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getStudentCourseDetail,
  getStudentCourseProjects,
  getCourseEnrollmentStudents,
  getCourseProjectMyTeam,
  getManualTeamStudents,
  getAiTeamRecommendations,
  getEligibleTeamInvitations,
  sendManualTeamRequest,
  acceptTeamInvitation,
  rejectTeamInvitation,
  type StudentCourseProject,
  type CourseMyTeamResponse,
  type ManualTeamStudent,
  type AiTeamRecommendation,
  type TeamInvitationItem,
  type CourseEnrollmentStudent,
} from "@/api/studentCoursesApi";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { parseCourseProjectDescription } from "@/lib/courseProjectDescription";
import {
  initialsFromName,
  formatProjectSectionsLabel,
} from "@/lib/studentManageCourses";
import { filterEligibleCourseProjects } from "@/lib/courseProjectEligibility";
import { formatAiMode } from "@/components/doctor/course-workspace/courseWorkspaceUtils";
import { StudentLedTeamFormationPanel } from "@/components/student/team-formation/StudentLedTeamFormationPanel";
import { Button } from "@/components/ui/button";
import { openCourseTeamChat } from "@/lib/openCourseTeamChat";
import { studentCoursePath, studentMessageThreadPath, ROUTES } from "@/routes/paths";
import "@/styles/student-manage-courses.css";

export default function StudentCourseProjectDetailsPage() {
  const navigate = useNavigate();
  const { courseId: courseIdParam, projectId: projectIdParam } = useParams<{
    courseId: string;
    projectId: string;
  }>();

  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const projectId = projectIdParam ? Number(projectIdParam) : NaN;
  const validIds =
    Number.isFinite(courseId) &&
    courseId > 0 &&
    Number.isFinite(projectId) &&
    projectId > 0;

  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [mySectionName, setMySectionName] = useState("");
  const [project, setProject] = useState<StudentCourseProject | null>(null);
  const [myTeam, setMyTeam] = useState<CourseMyTeamResponse | null>(null);
  const [roster, setRoster] = useState<ManualTeamStudent[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiTeamRecommendation[]>([]);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [enrollmentByStudentId, setEnrollmentByStudentId] = useState<
    Record<number, CourseEnrollmentStudent>
  >({});
  const [receivedInvites, setReceivedInvites] = useState<TeamInvitationItem[]>([]);
  const [sentPending, setSentPending] = useState<ManualTeamStudent[]>([]);
  const [inviteBusyId, setInviteBusyId] = useState<number | null>(null);
  const [invitationBusyId, setInvitationBusyId] = useState<number | null>(null);

  const aiMode = project?.aiMode?.trim().toLowerCase() === "student" ? "student" : "doctor";
  const isDoctorLed = aiMode === "doctor";
  const isStudentLed = aiMode === "student";
  const hasTeam = Boolean(project?.hasTeam && myTeam);
  const showMyTeam = hasTeam && myTeam != null;
  const showDoctorWaiting = isDoctorLed && !hasTeam;
  const showFindTeammates = isStudentLed && !hasTeam;

  const parsed = useMemo(
    () => parseCourseProjectDescription(project?.description),
    [project?.description],
  );

  const load = useCallback(async () => {
    if (!validIds) {
      navigate(ROUTES.studentCourses, { replace: true });
      return;
    }
    setLoading(true);
    try {
      const [detail, allProjects, students, team, allInvites] = await Promise.all([
        getStudentCourseDetail(courseId),
        getStudentCourseProjects(courseId),
        getCourseEnrollmentStudents(courseId),
        getCourseProjectMyTeam(projectId),
        getEligibleTeamInvitations(),
      ]);

      const eligibleProjects = filterEligibleCourseProjects(allProjects, detail.mySectionId);
      const match = eligibleProjects.find((p) => p.id === projectId);
      if (!match) {
        navigate(studentCoursePath(courseId), { replace: true });
        return;
      }

      setCourseName(detail.name);
      setDoctorName(detail.doctorName);
      setMySectionName(detail.mySectionName);
      setProject(match);
      setMyTeam(team);

      const byId: Record<number, CourseEnrollmentStudent> = {};
      for (const s of students) byId[s.studentId] = s;
      setEnrollmentByStudentId(byId);

      if (match.aiMode?.trim().toLowerCase() === "student" && !match.hasTeam) {
        const manual = await getManualTeamStudents(courseId, projectId);
        setRoster(manual.students);
        setSentPending(
          manual.students.filter(
            (s) => s.hasPendingRequest && s.availabilityStatus === "pending",
          ),
        );
        setReceivedInvites(
          allInvites.filter((i) => i.courseId === courseId && i.projectId === projectId),
        );
      } else {
        setRoster([]);
        setSentPending([]);
        setReceivedInvites([]);
        setAiSuggestions([]);
        setAiLoaded(false);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load project",
        description: parseApiErrorMessage(err),
      });
      navigate(studentCoursePath(courseId), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [validIds, courseId, projectId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGenerateAi = async () => {
    if (!validIds) return;
    setAiLoading(true);
    try {
      const rows = await getAiTeamRecommendations(courseId, projectId);
      setAiSuggestions(rows);
      setAiLoaded(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load recommendations",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleInvite = async (receiverId: number) => {
    if (!validIds) return;
    setInviteBusyId(receiverId);
    try {
      const res = await sendManualTeamRequest(courseId, projectId, receiverId);
      toast({ title: res.message?.trim() || "Invitation sent" });
      const manual = await getManualTeamStudents(courseId, projectId);
      setRoster(manual.students);
      setSentPending(
        manual.students.filter(
          (s) => s.hasPendingRequest && s.availabilityStatus === "pending",
        ),
      );
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invitation failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setInviteBusyId(null);
    }
  };

  const handleAcceptInvite = async (invitationId: number) => {
    setInvitationBusyId(invitationId);
    try {
      await acceptTeamInvitation(invitationId);
      toast({ title: "Invitation accepted" });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not accept",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setInvitationBusyId(null);
    }
  };

  const handleRejectInvite = async (invitationId: number) => {
    setInvitationBusyId(invitationId);
    try {
      await rejectTeamInvitation(invitationId);
      toast({ title: "Invitation declined" });
      setReceivedInvites((prev) => prev.filter((i) => i.invitationId !== invitationId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not decline",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setInvitationBusyId(null);
    }
  };

  if (!validIds || loading || !project) {
    return (
      <div className="student-manage-courses student-hub min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading project" />
      </div>
    );
  }

  const publicDescription =
    parsed.publicDescription.trim() || "No description provided.";
  const teamStatusLabel = isDoctorLed
    ? hasTeam
      ? "Assigned by Doctor"
      : "Waiting for team generation"
    : hasTeam
      ? "Team formed"
      : "Form your team";

  return (
    <div className="student-manage-courses student-hub min-h-full">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 animate-fade-in">
        <button
          type="button"
          onClick={() => navigate(studentCoursePath(courseId))}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="h-4 w-4" /> Back to course
        </button>

        <header className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{formatAiMode(aiMode)}</Badge>
            <Badge variant="outline">{teamStatusLabel}</Badge>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{publicDescription}</p>

          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <InfoItem label="Team size" value={String(project.teamSize)} />
            <InfoItem label="AI mode" value={formatAiMode(aiMode)} />
            <InfoItem label="Instructor" value={doctorName} />
            <InfoItem label="Course" value={courseName} />
            <InfoItem label="Your section" value={mySectionName} />
            <InfoItem label="Project sections" value={formatProjectSectionsLabel(project)} />
          </dl>

          {parsed.requiredSkills.length > 0 ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Required skills
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parsed.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-medium px-2 py-1 rounded-md bg-primary-soft text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        {showMyTeam && myTeam ? (
          <MyTeamPanel
            team={myTeam}
            teamSize={project.teamSize}
            statusLabel={teamStatusLabel}
            enrollmentByStudentId={enrollmentByStudentId}
          />
        ) : null}

        {showDoctorWaiting ? (
          <section className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-2">
            <h2 className="font-display text-lg font-bold">Waiting for Doctor Team Generation</h2>
            <p className="text-sm text-muted-foreground">
              Your instructor will assign teams for this project. You will be notified when your
              team is ready.
            </p>
          </section>
        ) : null}

        {showFindTeammates ? (
          <StudentLedTeamFormationPanel
            roster={roster}
            aiSuggestions={aiSuggestions}
            aiLoaded={aiLoaded}
            aiLoading={aiLoading}
            receivedInvites={receivedInvites}
            sentPending={sentPending}
            enrollmentByStudentId={enrollmentByStudentId}
            inviteBusyId={inviteBusyId}
            invitationBusyId={invitationBusyId}
            onGenerateAi={() => void handleGenerateAi()}
            onInvite={(id) => void handleInvite(id)}
            onAcceptInvite={(id) => void handleAcceptInvite(id)}
            onRejectInvite={(id) => void handleRejectInvite(id)}
          />
        ) : null}
      </div>
    </div>
  );
}

function MyTeamPanel({
  team,
  teamSize,
  statusLabel,
  enrollmentByStudentId,
}: {
  team: CourseMyTeamResponse;
  teamSize: number;
  statusLabel: string;
  enrollmentByStudentId: Record<number, CourseEnrollmentStudent>;
}) {
  const navigate = useNavigate();
  const [openingChat, setOpeningChat] = useState(false);
  const teamName = `Team ${team.teamIndex + 1}`;

  async function handleOpenTeamChat() {
    setOpeningChat(true);
    try {
      await openCourseTeamChat(team.teamId, navigate, studentMessageThreadPath);
    } catch (err) {
      toast({
        title: "Could not open team chat",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setOpeningChat(false);
    }
  }

  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">My team</h2>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={openingChat}
          onClick={() => void handleOpenTeamChat()}
        >
          {openingChat ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          Open team chat
        </Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <InfoItem label="Team" value={teamName} />
        <InfoItem label="Team size" value={`${team.members.length} / ${teamSize}`} />
        <InfoItem label="Team status" value={statusLabel} />
      </div>
      <ul className="space-y-3">
        {team.members.map((member) => {
          const profile = enrollmentByStudentId[member.studentId];
          const major = profile?.major?.trim() || "—";
          const skills = profile?.skills ?? [];
          return (
            <li
              key={member.studentId}
              className="flex items-start gap-3 rounded-xl border border-border p-4"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-bold shrink-0">
                {initialsFromName(member.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{member.name}</div>
                <div className="text-xs text-muted-foreground">{major}</div>
                {skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {skills.map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
