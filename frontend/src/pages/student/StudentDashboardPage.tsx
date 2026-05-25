import { useCallback, useEffect, useMemo, useState } from "react";
import "@/styles/student-hub.css";
import { FolderKanban, Mail, Sparkles, Users } from "lucide-react";
import { getMe } from "@/api/meApi";
import { getDashboardSummary } from "@/api/dashboardApi";
import { getGraduationProjectsMyEnvelope, type GradProject } from "@/api/gradProjectApi";
import {
  acceptTeamInvitation,
  getEnrolledCourses,
  getTeamInvitations,
  rejectTeamInvitation,
  type TeamInvitationItem,
} from "@/api/studentCoursesApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StudentOverview, type StudentOverviewData } from "@/components/dashboard/StudentOverview";
import { StudentInsights, type InsightMetric } from "@/components/dashboard/StudentInsights";
import { TeamInvitations, type TeamInvitationView } from "@/components/dashboard/TeamInvitations";
import {
  GraduationProject,
  type GraduationProjectView,
} from "@/components/dashboard/GraduationProject";
import { CoursesArea } from "@/components/dashboard/CoursesArea";
import { toast } from "@/hooks/use-toast";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mergeSkills(
  roles: string[] = [],
  technical: string[] = [],
  tools: string[] = [],
  general: string[] = [],
  major: string[] = [],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...roles, ...technical, ...tools, ...general, ...major]) {
    const t = s.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function mapInvitations(items: TeamInvitationItem[]): TeamInvitationView[] {
  return items.map((inv) => ({
    id: String(inv.invitationId),
    inviter: inv.senderName,
    inviterInitials: initials(inv.senderName),
    team: inv.senderSection || inv.courseName,
    project: inv.projectTitle,
  }));
}

function mapGradProject(project: GradProject): GraduationProjectView {
  const description =
    (project.abstract ?? project.description ?? "").trim() ||
    "No project description provided yet.";
  return {
    title: project.name,
    description,
    status: "In Progress",
    skills: project.requiredSkills ?? [],
    teamSize: `${project.currentMembers} / ${project.partnersCount}`,
  };
}

const StudentDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StudentOverviewData | null>(null);
  const [insights, setInsights] = useState<InsightMetric[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitationView[]>([]);
  const [gradProject, setGradProject] = useState<GraduationProjectView | null>(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [partnerActivity, setPartnerActivity] = useState(0);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [me, summary, gradEnvelope, teamInvites, enrolled] = await Promise.all([
        getMe(),
        getDashboardSummary(),
        getGraduationProjectsMyEnvelope(),
        getTeamInvitations(),
        getEnrolledCourses(),
      ]);

      const skills = mergeSkills(
        me.roles,
        me.technicalSkills,
        me.tools,
        me.generalSkills,
        me.majorSkills,
      );

      setOverview({
        name: me.name || summary.name,
        major: me.major || summary.major,
        year: me.academicYear || summary.academicYear,
        university: me.university || summary.university,
        skills,
        initials: initials(me.name || summary.name),
        photoUrl: me.profilePictureBase64 ?? null,
      });

      const teammatesCount =
        summary.suggestedTeammatesCount ?? summary.suggestedTeammates?.length ?? 0;
      const matchedCount = summary.matchedGraduationProjectsCount ?? 0;
      const bestMatch =
        summary.bestTeammateMatchPercent ??
        (summary.suggestedTeammates?.[0]?.matchScore != null
          ? summary.suggestedTeammates[0].matchScore
          : null);
      const pendingInvites = summary.pendingTeamInvitationsCount ?? teamInvites.length;

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

      setInvitations(mapInvitations(teamInvites));
      setGradProject(gradEnvelope.project ? mapGradProject(gradEnvelope.project) : null);
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
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleAccept = async (id: string) => {
    setBusyInviteId(id);
    try {
      await acceptTeamInvitation(Number(id));
      toast({ title: "Invitation accepted", description: "You joined the team." });
      await loadDashboard();
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
    setBusyInviteId(id);
    try {
      await rejectTeamInvitation(Number(id));
      toast({ title: "Invitation declined" });
      await loadDashboard();
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

  if (loading || !overview) {
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
            <StudentOverview student={overview} />

            <StudentInsights metrics={insightsReady} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <TeamInvitations
                invitations={invitations}
                empty={invitations.length === 0}
                busyId={busyInviteId}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
              <GraduationProject project={gradProject} empty={!gradProject} />
            </div>

            <CoursesArea enrolled={enrolledCount} partners={partnerActivity} />
          </div>
        </div>
    </div>
  );
};

export default StudentDashboardPage;
