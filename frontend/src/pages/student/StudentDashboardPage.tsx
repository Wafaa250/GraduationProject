import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "@/styles/student-hub.css";
import { FolderKanban, Mail, Sparkles, Users } from "lucide-react";
import { getMe } from "@/api/meApi";
import { getDashboardSummary } from "@/api/dashboardApi";
import {
  deriveProjectStatus,
  getGraduationProjectsMyEnvelope,
  type GradProject,
} from "@/api/gradProjectApi";
import {
  acceptProjectInvitation,
  getReceivedProjectInvitations,
  rejectProjectInvitation,
} from "@/api/invitationsApi";
import { isPendingInvitationStatus } from "@/lib/graduationInvitationResolver";
import { getAllNotifications } from "@/api/notificationsApi";
import {
  acceptTeamInvitation,
  filterEligibleCourseTeamInvitations,
  getEnrolledCourses,
  getTeamInvitations,
  rejectTeamInvitation,
} from "@/api/studentCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StudentInsights, type InsightMetric } from "@/components/dashboard/StudentInsights";
import {
  TeamInvitations,
  type TeamInvitationView,
} from "@/components/dashboard/TeamInvitations";
import {
  GraduationProject,
  type GraduationProjectView,
} from "@/components/dashboard/GraduationProject";
import { CoursesArea } from "@/components/dashboard/CoursesArea";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/routes/paths";
import {
  getGraduationSectionTitle,
  projectTypeLabel,
} from "@/lib/graduationProjectTypes";
import { logDashboardDeepLink } from "@/lib/dashboardDeepLinkTrace";
import {
  auditTeamInvitationInbox,
  filterPendingGraduationInvitations,
  mapCourseTeamInvitations,
  mapGraduationTeamInvitations,
  mergeTeamInvitationInbox,
} from "@/lib/teamInvitationInbox";

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
    status: deriveProjectStatus(project),
    skills: project.requiredSkills ?? [],
    teamSize: `${project.currentMembers} / ${project.partnersCount}`,
    stageLabel:
      project.projectTypeLabel ??
      projectTypeLabel(project.projectType, faculty, major),
  };
}

type PendingDeepLink = {
  focus: "course-invitation" | "graduation-invitation";
  invitationId: string | null;
};

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const invitationsSectionRef = useRef<HTMLDivElement | null>(null);
  const loadSeqRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const pendingDeepLinkRef = useRef<PendingDeepLink | null>(null);
  const consumedDeepLinkKeyRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitationView[]>([]);
  const [gradProject, setGradProject] = useState<GraduationProjectView | null>(null);
  const [gradSectionTitle, setGradSectionTitle] = useState("Graduation Project");
  const [gradCourseLabels, setGradCourseLabels] = useState<string[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [partnerActivity, setPartnerActivity] = useState(0);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [highlightCourseInviteId, setHighlightCourseInviteId] = useState<string | null>(null);
  const [highlightGradInviteId, setHighlightGradInviteId] = useState<string | null>(null);

  const focusValue = searchParams.get("focus");
  const invitationIdValue = searchParams.get("invitationId");
  const deepLinkSearchKey = `${focusValue ?? ""}|${invitationIdValue ?? ""}`;
  const deepLinkToken = (location.state as { notificationDeepLinkAt?: number } | null)
    ?.notificationDeepLinkAt;
  const deepLinkKey = `${deepLinkSearchKey}|${deepLinkToken ?? "none"}`;

  useEffect(() => {
    logDashboardDeepLink("dashboard_mount", {
      pathname: location.pathname,
      search: location.search,
      focus_value: focusValue,
      invitationId: invitationIdValue,
    });
  }, []);

  const loadDashboard = useCallback(async (reason: string) => {
    const seq = ++loadSeqRef.current;
    const showFullScreenLoader = !hasLoadedOnceRef.current;

    logDashboardDeepLink("api_start", { reason, seq, showFullScreenLoader });
    if (showFullScreenLoader) {
      setLoading(true);
      logDashboardDeepLink("loading_state_change", { loading: true, seq, reason });
    }

    try {
      const results = await Promise.allSettled([
        getMe(),
        getDashboardSummary(),
        getGraduationProjectsMyEnvelope(),
        getTeamInvitations(),
        getReceivedProjectInvitations(),
        getEnrolledCourses(),
        ...(import.meta.env.DEV ? [getAllNotifications(100)] : []),
      ]);

      const failures = results
        .map((result, index) => ({ result, index }))
        .filter((entry) => entry.result.status === "rejected");

      if (failures.length > 0) {
        const firstError = failures[0].result;
        const message =
          firstError.status === "rejected"
            ? parseApiErrorMessage(firstError.reason)
            : "Request failed.";
        logDashboardDeepLink("api_error", {
          seq,
          failedCount: failures.length,
          failedIndexes: failures.map((f) => f.index),
          message,
        });
        toast({
          title: "Could not load dashboard",
          description: message,
          variant: "destructive",
        });
      } else {
        logDashboardDeepLink("api_success", { seq });
      }

      const me = results[0].status === "fulfilled" ? results[0].value : null;
      const summary = results[1].status === "fulfilled" ? results[1].value : null;
      const gradEnvelope =
        results[2].status === "fulfilled" ? results[2].value : { project: null };
      const teamInvites = results[3].status === "fulfilled" ? results[3].value : [];
      const gradInvites = results[4].status === "fulfilled" ? results[4].value : [];
      const enrolled = results[5].status === "fulfilled" ? results[5].value : [];
      const notifications =
        import.meta.env.DEV && results[6]?.status === "fulfilled" ? results[6].value : [];

      const teammatesCount =
        summary?.suggestedTeammatesCount ?? summary?.suggestedTeammates?.length ?? 0;
      const matchedCount = summary?.matchedGraduationProjectsCount ?? 0;
      const bestMatch =
        summary?.bestTeammateMatchPercent ??
        (summary?.suggestedTeammates?.[0]?.matchScore != null
          ? summary.suggestedTeammates[0].matchScore
          : null);
      const pendingCourseInvites = teamInvites.length;
      const pendingGradInvites = gradInvites.filter((i) => isPendingInvitationStatus(i.status)).length;
      const pendingInvites = pendingCourseInvites + pendingGradInvites;

      const courseMapped = mapCourseTeamInvitations(teamInvites);
      const graduationMapped = mapGraduationTeamInvitations(gradInvites);
      const mergedInvitations = mergeTeamInvitationInbox(courseMapped, graduationMapped);

      if (import.meta.env.DEV) {
        const courseEligible = await filterEligibleCourseTeamInvitations(teamInvites);
        auditTeamInvitationInbox({
          notifications,
          courseFromApi: teamInvites,
          courseAfterEligibleFilter: courseEligible,
          gradFromApi: gradInvites,
          gradAfterPendingFilter: filterPendingGraduationInvitations(gradInvites),
          displayed: mergedInvitations,
        });
      }

      setInsights([
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
          value: String(pendingInvites),
          hint: "Awaiting your reply",
          icon: Mail,
          tint: "from-success/20 to-success/5",
          icon_color: "text-success",
        },
      ]);

      setInvitations(mergedInvitations);
      setGradSectionTitle(getGraduationSectionTitle(me?.faculty, me?.major));
      setGradCourseLabels(me?.graduationProjectCourses ?? []);
      setGradProject(
        gradEnvelope.project
          ? mapGradProject(gradEnvelope.project, me?.faculty, me?.major)
          : null,
      );
      setEnrolledCount(enrolled.length);
      setPartnerActivity(teammatesCount);
    } catch (err) {
      logDashboardDeepLink("api_error", {
        seq,
        message: parseApiErrorMessage(err),
        unexpected: true,
      });
      toast({
        title: "Could not load dashboard",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      if (seq === loadSeqRef.current) {
        hasLoadedOnceRef.current = true;
        setLoading(false);
        logDashboardDeepLink("loading_state_change", { loading: false, seq, reason });
        logDashboardDeepLink("render_complete", { seq, reason });
      }
    }
  }, []);

  useEffect(() => {
    void loadDashboard("mount");
  }, [loadDashboard]);

  // Capture deep-link params once and strip them from the URL immediately to avoid reload loops.
  useEffect(() => {
    if (
      focusValue !== "course-invitation" &&
      focusValue !== "graduation-invitation"
    ) {
      return;
    }

    if (consumedDeepLinkKeyRef.current === deepLinkKey) {
      return;
    }

    consumedDeepLinkKeyRef.current = deepLinkKey;
    pendingDeepLinkRef.current = {
      focus: focusValue,
      invitationId: invitationIdValue,
    };

    logDashboardDeepLink("focus_value", {
      focus_value: focusValue,
      invitationId: invitationIdValue,
      deepLinkKey,
    });

    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    next.delete("invitationId");
    setSearchParams(next, { replace: true });
  }, [deepLinkKey, deepLinkSearchKey, focusValue, invitationIdValue, searchParams, setSearchParams]);

  useEffect(() => {
    if (loading) return;

    const pending = pendingDeepLinkRef.current;
    if (!pending) return;

    pendingDeepLinkRef.current = null;

    logDashboardDeepLink("invitation_lookup_start", {
      focus_value: pending.focus,
      invitationId: pending.invitationId,
      inviteCount: invitations.length,
    });

    invitationsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (pending.focus === "course-invitation" && pending.invitationId) {
      const exists = invitations.some(
        (inv) => inv.kind === "course" && inv.rawId === pending.invitationId,
      );
      logDashboardDeepLink("invitation_lookup_result", {
        focus_value: pending.focus,
        invitationId: pending.invitationId,
        found: exists,
        availableIds: invitations.filter((inv) => inv.kind === "course").map((inv) => inv.rawId),
      });
      if (exists) {
        setHighlightCourseInviteId(pending.invitationId);
      } else {
        toast({
          title: "Invitation unavailable",
          description: "This invitation is no longer available.",
        });
      }
    }

    if (pending.focus === "graduation-invitation" && pending.invitationId) {
      const exists = invitations.some(
        (inv) => inv.kind === "graduation" && inv.rawId === pending.invitationId,
      );
      logDashboardDeepLink("invitation_lookup_result", {
        focus_value: pending.focus,
        invitationId: pending.invitationId,
        found: exists,
        availableIds: invitations.filter((inv) => inv.kind === "graduation").map((inv) => inv.rawId),
      });
      if (exists) {
        setHighlightGradInviteId(pending.invitationId);
      } else {
        toast({
          title: "Invitation unavailable",
          description: "This invitation is no longer available.",
        });
      }
    }

    logDashboardDeepLink("render_complete", {
      focus_value: pending.focus,
      invitationId: pending.invitationId,
      afterDeepLink: true,
    });
  }, [loading, invitations]);

  const handleAccept = async (invitation: TeamInvitationView) => {
    setBusyInviteId(invitation.id);
    try {
      if (invitation.kind === "graduation") {
        await acceptProjectInvitation(Number(invitation.rawId));
        toast({
          title: "Invitation accepted",
          description: "You joined the graduation project team.",
        });
        await loadDashboard("accept_graduation_invite");
        navigate(ROUTES.graduationProjectWorkspace, { replace: true });
        return;
      }

      if (invitation.kind === "course") {
        await acceptTeamInvitation(Number(invitation.rawId));
        toast({ title: "Invitation accepted", description: "You joined the team." });
        await loadDashboard("accept_course_invite");
        return;
      }

      toast({
        title: "Invitation unavailable",
        description: "This invitation type is not supported yet.",
        variant: "destructive",
      });
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

  const handleDecline = async (invitation: TeamInvitationView) => {
    setBusyInviteId(invitation.id);
    try {
      if (invitation.kind === "graduation") {
        await rejectProjectInvitation(Number(invitation.rawId));
        toast({ title: "Invitation declined" });
        await loadDashboard("decline_graduation_invite");
        return;
      }

      if (invitation.kind === "course") {
        await rejectTeamInvitation(Number(invitation.rawId));
        toast({ title: "Invitation declined" });
        await loadDashboard("decline_course_invite");
        return;
      }

      toast({
        title: "Invitation unavailable",
        description: "This invitation type is not supported yet.",
        variant: "destructive",
      });
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

  const insightsReady = useMemo(() => insights, [insights]);

  useEffect(() => {
    logDashboardDeepLink("loading_state_change", { loading, rendering: loading ? "spinner" : "dashboard" });
  }, [loading]);

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

            <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-6 md:gap-8">
              <div ref={invitationsSectionRef} className="flex min-w-0 flex-col gap-4">
                <TeamInvitations
                  invitations={invitations}
                  empty={invitations.length === 0}
                  busyId={busyInviteId}
                  highlightId={highlightCourseInviteId ?? highlightGradInviteId}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              </div>
              <div className="min-w-0">
                <GraduationProject
                  project={gradProject}
                  empty={!gradProject}
                  sectionTitle={gradSectionTitle}
                  courseLabels={gradCourseLabels}
                />
              </div>
            </div>

            <div className="relative w-full">
              <CoursesArea enrolled={enrolledCount} partners={partnerActivity} />
            </div>
          </div>
        </div>
    </div>
  );
};

export default StudentDashboardPage;
