import { useCallback, useEffect, useMemo, useState } from "react";
import "@/styles/student-hub.css";
import { FolderKanban, Mail, Sparkles, Users } from "lucide-react";
import { getMe } from "@/api/meApi";
import { getDashboardSummary } from "@/api/dashboardApi";
import { getGraduationProjectsMyEnvelope, type GradProject } from "@/api/gradProjectApi";
import {
  acceptInvitation,
  getReceivedInvitations,
  rejectInvitation,
  type ReceivedProjectInvitation,
} from "@/api/invitationsApi";
import {
  acceptTeamInvitation,
  getEnrolledCourses,
  getEligibleTeamInvitations,
  rejectTeamInvitation,
  type TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StudentInsights, type InsightMetric } from "@/components/dashboard/StudentInsights";
import { TeamInvitations, type TeamInvitationView } from "@/components/dashboard/TeamInvitations";
import {
  GraduationProject,
  type GraduationProjectView,
} from "@/components/dashboard/GraduationProject";
import { CoursesArea } from "@/components/dashboard/CoursesArea";
import { toast } from "@/hooks/use-toast";
import {
  getGraduationSectionTitle,
  projectTypeLabel,
} from "@/lib/graduationProjectTypes";

const GRAD_INVITE_PREFIX = "gp:";
const COURSE_INVITE_PREFIX = "course:";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mapGraduationInvitations(items: ReceivedProjectInvitation[]): TeamInvitationView[] {
  return items.map((inv) => ({
    id: `${GRAD_INVITE_PREFIX}${inv.invitationId}`,
    inviter: inv.senderName,
    inviterInitials: initials(inv.senderName),
    team: "Graduation Project",
    project: inv.projectName,
  }));
}

function mapCourseInvitations(items: TeamInvitationItem[]): TeamInvitationView[] {
  return items.map((inv) => ({
    id: `${COURSE_INVITE_PREFIX}${inv.invitationId}`,
    inviter: inv.senderName,
    inviterInitials: initials(inv.senderName),
    team: inv.senderSection || inv.courseName,
    project: inv.projectTitle,
  }));
}

function parseInvitationId(id: string): { source: "graduation" | "course"; invitationId: number } | null {
  if (id.startsWith(GRAD_INVITE_PREFIX)) {
    const invitationId = Number(id.slice(GRAD_INVITE_PREFIX.length));
    return Number.isFinite(invitationId) ? { source: "graduation", invitationId } : null;
  }
  if (id.startsWith(COURSE_INVITE_PREFIX)) {
    const invitationId = Number(id.slice(COURSE_INVITE_PREFIX.length));
    return Number.isFinite(invitationId) ? { source: "course", invitationId } : null;
  }
  return null;
}

function mapGradProject(
  project: GradProject,
  faculty?: string | null,
  major?: string | null,
): GraduationProjectView {
  const description =
    (project.abstract ?? project.description ?? "").trim() ||
    "No project description provided yet.";
  return {
    title: project.name,
    description,
    status: "In Progress",
    skills: project.requiredSkills ?? [],
    teamSize: `${project.currentMembers} / ${project.partnersCount}`,
    stageLabel:
      project.projectTypeLabel ??
      projectTypeLabel(project.projectType, faculty, major),
  };
}

const StudentDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [gradInvitations, setGradInvitations] = useState<ReceivedProjectInvitation[]>([]);
  const [courseInvitations, setCourseInvitations] = useState<TeamInvitationItem[]>([]);
  const [gradProject, setGradProject] = useState<GraduationProjectView | null>(null);
  const [gradSectionTitle, setGradSectionTitle] = useState("Graduation Project");
  const [gradCourseLabels, setGradCourseLabels] = useState<string[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [partnerActivity, setPartnerActivity] = useState(0);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const buildInsights = useCallback(
    (
      summary: Awaited<ReturnType<typeof getDashboardSummary>>,
      pendingInviteCount: number,
    ): InsightMetric[] => {
      const teammatesCount =
        summary.suggestedTeammatesCount ?? summary.suggestedTeammates?.length ?? 0;
      const matchedCount = summary.matchedGraduationProjectsCount ?? 0;
      const bestMatch =
        summary.bestTeammateMatchPercent ??
        (summary.suggestedTeammates?.[0]?.matchScore != null
          ? summary.suggestedTeammates[0].matchScore
          : null);

      return [
        {
          label: "Suggested Teammates",
          value: String(teammatesCount),
          hint: "AI-matched to your skills",
          icon: Users,
          tint: "from-primary/15 to-primary/5",
          icon_color: "text-primary",
        },
        {
          label: "Matched Projects",
          value: String(matchedCount),
          hint: "Open for collaboration",
          icon: FolderKanban,
          tint: "from-accent/20 to-accent/5",
          icon_color: "text-accent",
        },
        {
          label: "Best Match",
          value: bestMatch != null ? `${bestMatch}%` : "—",
          hint: "Top project fit",
          icon: Sparkles,
          tint: "from-primary-glow/25 to-primary-glow/5",
          icon_color: "text-primary-glow",
        },
        {
          label: "Team Invitations",
          value: String(pendingInviteCount),
          hint: "Awaiting your reply",
          icon: Mail,
          tint: "from-success/20 to-success/5",
          icon_color: "text-success",
        },
      ];
    },
    [],
  );

  const refreshGradProjectState = useCallback(async () => {
    const [me, gradEnvelope] = await Promise.all([getMe(), getGraduationProjectsMyEnvelope()]);
    setGradSectionTitle(getGraduationSectionTitle(me.faculty, me.major));
    setGradCourseLabels(me.graduationProjectCourses ?? []);
    setGradProject(
      gradEnvelope.project
        ? mapGradProject(gradEnvelope.project, me.faculty, me.major)
        : null,
    );
  }, []);

  const fetchGraduationInvitations = useCallback(async () => {
    try {
      const received = await getReceivedInvitations();
      const pendingOnly = received.filter((i) => i.status?.toLowerCase() === "pending");
      setGradInvitations(pendingOnly);
      return pendingOnly;
    } catch {
      return null;
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [me, summary, gradEnvelope, receivedInvites, teamInvites, enrolled] =
        await Promise.all([
          getMe(),
          getDashboardSummary(),
          getGraduationProjectsMyEnvelope(),
          getReceivedInvitations().catch(() => [] as ReceivedProjectInvitation[]),
          getEligibleTeamInvitations(),
          getEnrolledCourses(),
        ]);

      const pendingGradInvites = receivedInvites.filter(
        (i) => i.status?.toLowerCase() === "pending",
      );
      const pendingInviteCount = pendingGradInvites.length + teamInvites.length;
      const teammatesCount =
        summary.suggestedTeammatesCount ?? summary.suggestedTeammates?.length ?? 0;

      setInsights(buildInsights(summary, pendingInviteCount));
      setGradInvitations(pendingGradInvites);
      setCourseInvitations(teamInvites);
      setGradSectionTitle(getGraduationSectionTitle(me.faculty, me.major));
      setGradCourseLabels(me.graduationProjectCourses ?? []);
      setGradProject(
        gradEnvelope.project
          ? mapGradProject(gradEnvelope.project, me.faculty, me.major)
          : null,
      );
      setEnrolledCount(enrolled.length);
      setPartnerActivity(teammatesCount);
    } catch (err) {
      toast({
        title: "Could not load dashboard",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [buildInsights]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchGraduationInvitations();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchGraduationInvitations]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchGraduationInvitations();
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchGraduationInvitations]);

  const invitations = useMemo(
    () => [
      ...mapGraduationInvitations(gradInvitations),
      ...mapCourseInvitations(courseInvitations),
    ],
    [gradInvitations, courseInvitations],
  );

  const handleAccept = async (id: string) => {
    const parsed = parseInvitationId(id);
    if (!parsed) return;

    setBusyInviteId(id);
    try {
      if (parsed.source === "graduation") {
        await acceptInvitation(parsed.invitationId);
        setGradInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
        toast({
          title: "Invitation accepted",
          description: "You joined the graduation project team.",
        });
        await fetchGraduationInvitations();
        await refreshGradProjectState();
      } else {
        await acceptTeamInvitation(parsed.invitationId);
        setCourseInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
        toast({ title: "Invitation accepted", description: "You joined the team." });
        await loadDashboard();
      }
    } catch (err) {
      toast({
        title: "Could not accept invitation",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusyInviteId(null);
    }
  };

  const handleDecline = async (id: string) => {
    const parsed = parseInvitationId(id);
    if (!parsed) return;

    setBusyInviteId(id);
    try {
      if (parsed.source === "graduation") {
        await rejectInvitation(parsed.invitationId);
        setGradInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
        toast({ title: "Invitation declined" });
        await fetchGraduationInvitations();
      } else {
        await rejectTeamInvitation(parsed.invitationId);
        setCourseInvitations((prev) =>
          prev.filter((inv) => inv.invitationId !== parsed.invitationId),
        );
        toast({ title: "Invitation declined" });
        await loadDashboard();
      }
    } catch (err) {
      toast({
        title: "Could not decline invitation",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusyInviteId(null);
    }
  };

  useEffect(() => {
    setInsights((prev) => {
      if (prev.length === 0) return prev;
      const pendingInviteCount = gradInvitations.length + courseInvitations.length;
      return prev.map((metric) =>
        metric.label === "Team Invitations"
          ? { ...metric, value: String(pendingInviteCount) }
          : metric,
      );
    });
  }, [gradInvitations.length, courseInvitations.length]);

  const insightsReady = useMemo(() => insights, [insights]);

  if (loading) {
    return (
      <div className="student-hub min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="student-hub min-h-full bg-hero">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <DashboardHeader />

          <div className="space-y-6 md:space-y-8">
            <StudentInsights metrics={insightsReady} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <TeamInvitations
                invitations={invitations}
                empty={invitations.length === 0}
                busyId={busyInviteId}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
              <GraduationProject
                project={gradProject}
                empty={!gradProject}
                sectionTitle={gradSectionTitle}
                courseLabels={gradCourseLabels}
              />
            </div>

            <CoursesArea enrolled={enrolledCount} partners={partnerActivity} />
          </div>
        </div>
    </div>
  );
};

export default StudentDashboardPage;
