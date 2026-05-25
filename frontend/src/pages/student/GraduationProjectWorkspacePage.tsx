import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  Crown,
  MessageCircle,
  ShieldCheck,
  BookOpen,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  ArrowUpRight,
  Lightbulb,
  FileText,
  Trash2,
  Award,
  ChevronRight,
  Briefcase,
  Brain,
  Loader2,
  MoreVertical,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "@/styles/project-workspace-hub.css";
import { ROUTES } from "@/routes/paths";
import { getMe, type StudentMeResponse } from "@/api/meApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  deleteGraduationProject,
  deriveProjectStatus,
  getGraduationProjectsMyEnvelope,
  getRecommendedStudents,
  getRecommendedSupervisors,
  inviteStudentToProject,
  requestProjectSupervisor,
  projectTypeLabel,
  type GradProject,
  type GradProjectMember,
  type GradProjectRecommendedStudent,
  type GradProjectRecommendedSupervisor,
} from "@/api/gradProjectApi";
import {
  cancelProjectInvitation,
  getSentProjectInvitations,
  type SentProjectInvitation,
} from "@/api/invitationsApi";
import { toast } from "@/hooks/use-toast";

/* ---------- small components ---------- */
const Chip = ({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "primary" | "accent";
}) => {
  const tones = {
    default: "bg-secondary text-secondary-foreground border-transparent",
    primary: "bg-primary/10 text-primary border-primary/15",
    accent: "bg-accent/10 text-accent border-accent/15",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "primary" | "accent";
}) => (
  <Card className="relative overflow-hidden border-border/60 shadow-soft">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === "primary" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const SectionHeader = ({
  icon: Icon,
  eyebrow,
  title,
  desc,
  action,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {eyebrow}
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
    </div>
    {action}
  </div>
);

const initials = (n: string) =>
  n
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const MatchRing = ({ value }: { value: number }) => {
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative h-14 w-14">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} className="fill-none stroke-secondary" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          className="fill-none stroke-primary"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold text-foreground">
        {value}%
      </span>
    </div>
  );
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function memberDisplayRole(m: GradProjectMember): string {
  return m.role === "leader" ? "Project Lead" : "Team Member";
}

function splitSpecialization(spec: string): string[] {
  return spec
    .split(/[,;|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function GraduationProjectWorkspacePage() {
  const navigate = useNavigate();
  const aiSectionRef = useRef<HTMLElement>(null);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<GradProject | null>(null);
  const [me, setMe] = useState<StudentMeResponse | null>(null);
  const [envelopeRole, setEnvelopeRole] = useState<"owner" | "member" | null>(null);
  const [aiTeammates, setAiTeammates] = useState<GradProjectRecommendedStudent[]>([]);
  const [supervisors, setSupervisors] = useState<GradProjectRecommendedSupervisor[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentProjectInvitation[]>([]);
  const [refreshingMatches, setRefreshingMatches] = useState(false);
  const [invitingStudentId, setInvitingStudentId] = useState<number | null>(null);
  const [requestingDoctorId, setRequestingDoctorId] = useState<number | null>(null);
  const [pendingSupervisorDoctorIds, setPendingSupervisorDoctorIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [cancellingInvitationId, setCancellingInvitationId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [heroActionsMenuOpen, setHeroActionsMenuOpen] = useState(false);
  const heroActionsMenuRef = useRef<HTMLDivElement>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const isOwner = Boolean(
    project?.isOwner ||
      envelopeRole === "owner" ||
      (me && project && project.ownerId === me.profileId),
  );
  const isLeader = Boolean(
    me &&
      project?.members.some((m) => m.role === "leader" && m.studentId === me.profileId),
  );
  const canManageTeam = isOwner || isLeader;
  const canInvite = isOwner;
  const canViewSupervisors = isOwner || isLeader;

  const desiredSize = project?.partnersCount ?? 0;
  const currentMembers = project?.currentMembers ?? 0;
  const completion =
    desiredSize > 0 ? Math.round((currentMembers / desiredSize) * 100) : 0;
  const seatsLeft =
    project?.remainingSeats ?? Math.max(0, desiredSize - currentMembers);

  const ownerMember = useMemo(() => {
    if (!project) return null;
    return (
      project.members.find((m) => m.studentId === project.ownerId) ??
      project.members.find((m) => m.role === "leader") ??
      null
    );
  }, [project]);

  const ownerName = project?.ownerName?.trim() || ownerMember?.name || "—";

  const invitationsByStatus = useMemo(() => {
    const pending: SentProjectInvitation[] = [];
    const accepted: SentProjectInvitation[] = [];
    const rejected: SentProjectInvitation[] = [];
    for (const inv of sentInvitations) {
      const status = inv.status.toLowerCase();
      if (status === "accepted") accepted.push(inv);
      else if (status === "rejected" || status === "cancelled" || status === "expired") {
        rejected.push(inv);
      } else if (status === "pending") pending.push(inv);
    }
    return { pending, accepted, rejected };
  }, [sentInvitations]);

  const requiredRoles = project?.requiredRoles ?? [];
  const preferredRoles = project?.preferredRoles ?? [];
  const skillPriorities = project?.skillPriorities ?? [];

  const pendingInviteReceiverIds = useMemo(
    () => new Set(invitationsByStatus.pending.map((i) => i.receiverId)),
    [invitationsByStatus.pending],
  );

  const invitationsUsed = sentInvitations.length;
  const decidedCount =
    invitationsByStatus.accepted.length + invitationsByStatus.rejected.length;
  const acceptanceRate =
    decidedCount > 0
      ? Math.round((invitationsByStatus.accepted.length / decidedCount) * 100)
      : null;

  const readinessLabel = useMemo(() => {
    if (!project) return "—";
    if (project.isFull || seatsLeft === 0) return "Ready";
    if (invitationsByStatus.pending.length > 0) return "Awaiting responses";
    if (completion >= 50) return "On track";
    return "Forming";
  }, [project, seatsLeft, invitationsByStatus.pending.length, completion]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [envelope, profile] = await Promise.all([getGraduationProjectsMyEnvelope(), getMe()]);
      setMe(profile);
      setEnvelopeRole(envelope.role);

      if (!envelope.project) {
        navigate(ROUTES.dashboard, { replace: true });
        return;
      }

      const proj = envelope.project;
      setProject(proj);

      const owner =
        envelope.role === "owner" ||
        proj.isOwner === true ||
        proj.ownerId === profile.profileId;
      const leader = proj.members.some(
        (m) => m.role === "leader" && m.studentId === profile.profileId,
      );

      const tasks: Promise<void>[] = [];

      if (owner || leader) {
        tasks.push(
          getRecommendedStudents(proj.id).then((rows) => {
            setAiTeammates(rows);
          }),
        );
      } else {
        setAiTeammates([]);
      }

      if (owner || leader) {
        tasks.push(
          getRecommendedSupervisors(proj.id)
            .then((rows) => {
              setSupervisors(rows);
            })
            .catch(() => {
              setSupervisors([]);
            }),
        );
      } else {
        setSupervisors([]);
      }

      if (owner) {
        tasks.push(
          getSentProjectInvitations(proj.id).then((rows) => {
            setSentInvitations(rows);
          }),
        );
      } else {
        setSentInvitations([]);
      }

      await Promise.all(tasks);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load workspace",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!heroActionsMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        heroActionsMenuOpen &&
        heroActionsMenuRef.current &&
        !heroActionsMenuRef.current.contains(target)
      ) {
        setHeroActionsMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHeroActionsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [heroActionsMenuOpen]);

  const refreshProject = async () => {
    const envelope = await getGraduationProjectsMyEnvelope();
    if (envelope.project) setProject(envelope.project);
    return envelope.project;
  };

  const refreshSupervisors = useCallback(async (projectId: number) => {
    if (!canViewSupervisors) return;
    try {
      const rows = await getRecommendedSupervisors(projectId);
      setSupervisors(rows);
    } catch {
      setSupervisors([]);
    }
  }, [canViewSupervisors]);

  const refreshMatches = async () => {
    if (!project || !canManageTeam) return;
    setRefreshingMatches(true);
    try {
      const rows = await getRecommendedStudents(project.id);
      setAiTeammates(rows);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not refresh matches",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setRefreshingMatches(false);
    }
  };

  const handleInviteStudent = async (studentId: number) => {
    if (!project || !canInvite) return;
    setInvitingStudentId(studentId);
    try {
      await inviteStudentToProject(project.id, studentId);
      toast({
        title: "Invitation sent",
        description: "The student has been invited to your project.",
      });
      const rows = await getSentProjectInvitations(project.id);
      setSentInvitations(rows);
      await refreshProject();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invitation failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setInvitingStudentId(null);
    }
  };

  const scrollToAiMatches = () => {
    aiSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!project || !canInvite) return;
    setCancellingInvitationId(invitationId);
    try {
      await cancelProjectInvitation(invitationId);
      toast({ title: "Invitation cancelled" });
      const rows = await getSentProjectInvitations(project.id);
      setSentInvitations(rows);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not cancel invitation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setCancellingInvitationId(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !isOwner) return;
    setDeletingProject(true);
    try {
      await deleteGraduationProject(project.id);
      toast({
        title: "Project deleted",
        description: "Your graduation project has been removed.",
      });
      setDeleteDialogOpen(false);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete project",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setDeletingProject(false);
    }
  };

  const handleRequestSupervisor = async (doctorId: number) => {
    if (!project || !canViewSupervisors || project.supervisor) return;
    setRequestingDoctorId(doctorId);
    try {
      await requestProjectSupervisor(project.id, doctorId);
      setPendingSupervisorDoctorIds((prev) => new Set(prev).add(doctorId));
      toast({
        title: "Supervision requested",
        description: "The faculty member will be notified of your request.",
      });
      const updated = await refreshProject();
      if (updated) await refreshSupervisors(updated.id);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setRequestingDoctorId(null);
    }
  };

  if (loading || !project) {
    return (
      <div className="project-workspace-hub flex min-h-[50vh] items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-label="Loading workspace" />
      </div>
    );
  }

  const stageLabel = projectTypeLabel(project.projectType);
  const statusLabel = deriveProjectStatus(project);
  const requiredSkills = project.requiredSkills ?? [];

  return (
    <div className="project-workspace-hub min-h-full bg-gradient-subtle">
      <main className="container space-y-12 py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to={ROUTES.dashboard} className="hover:text-foreground">
            Workspace
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Graduation Projects</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">My Project</span>
        </div>

        {/* SECTION 1 — HERO */}
        <section className="animate-fade-up">
          <Card className="relative overflow-hidden border-border/60 shadow-elevated">
            <div className="absolute inset-0 bg-gradient-hero opacity-[0.06]" />
            <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <CardContent className="relative p-6 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/15">
                        <Sparkles className="mr-1 h-3 w-3" /> {stageLabel}
                      </Badge>
                      <Badge className="border-0 bg-success/10 text-success hover:bg-success/15">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" /> {statusLabel}
                      </Badge>
                      {isOwner && (
                        <Badge variant="outline" className="border-border/70 bg-card/70">
                          <Crown className="mr-1 h-3 w-3 text-warning" /> Owner
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-border/70 bg-card/70">
                        <Calendar className="mr-1 h-3 w-3" /> {formatDate(project.createdAt)}
                      </Badge>
                      {project.lookingForTeammates !== false && (
                        <Badge variant="outline" className="border-border/70 bg-card/70">
                          <UserPlus className="mr-1 h-3 w-3" /> Looking for teammates
                        </Badge>
                      )}
                    </div>
                    {isOwner && (
                      <div ref={heroActionsMenuRef} className="relative shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg"
                          aria-expanded={heroActionsMenuOpen}
                          aria-haspopup="menu"
                          aria-label="More actions"
                          onClick={() => setHeroActionsMenuOpen((open) => !open)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {heroActionsMenuOpen && (
                          <Card
                            className="absolute right-0 top-11 z-40 w-[min(100vw-2rem,11rem)] border-border/60 shadow-elevated"
                            role="menu"
                            aria-label="More actions"
                          >
                            <CardContent className="p-1">
                              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                More Actions
                              </p>
                              <Link
                                to={ROUTES.createGraduationProject}
                                state={{ editProjectId: project.id }}
                                role="menuitem"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
                                onClick={() => setHeroActionsMenuOpen(false)}
                              >
                                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                                Edit Project
                              </Link>
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                                onClick={() => {
                                  setHeroActionsMenuOpen(false);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                                Delete Project
                              </button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>

                  <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-foreground text-balance md:text-4xl">
                    {project.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground text-balance">
                    {(project.abstract ?? project.description ?? "").trim() ||
                      "No project abstract provided yet."}
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.length > 0 ? (
                          requiredSkills.map((s) => (
                            <Chip key={s} tone="primary">
                              {s}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                    {requiredRoles.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Required roles
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {requiredRoles.map((s) => (
                            <Chip key={s} tone="accent">
                              {s}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                    {preferredRoles.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Preferred roles
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {preferredRoles.map((s) => (
                            <Chip key={s} tone="default">
                              {s}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                    {skillPriorities.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Skill priorities
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {skillPriorities.map((s) => (
                            <Chip key={s} tone="default">
                              {s}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {canInvite && (
                      <Button
                        size="lg"
                        className="rounded-xl bg-gradient-hero text-primary-foreground shadow-soft hover:opacity-95"
                        onClick={scrollToAiMatches}
                      >
                        <UserPlus className="mr-2 h-4 w-4" /> Invite Teammates
                      </Button>
                    )}
                    {canManageTeam && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-xl border-border/70"
                        onClick={scrollToAiMatches}
                      >
                        <Brain className="mr-2 h-4 w-4 text-primary" /> View AI Matches
                      </Button>
                    )}
                  </div>
                </div>

                {/* Hero side card */}
                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Team completion
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="font-display text-5xl font-bold tracking-tight text-foreground">
                      {completion}
                      <span className="text-2xl text-muted-foreground">%</span>
                    </span>
                    <Badge className="border-0 bg-primary/10 text-primary">
                      {currentMembers}/{desiredSize} members
                    </Badge>
                  </div>
                  <Progress value={completion} className="mt-4 h-2" />
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Seats remaining</p>
                      <p className="mt-0.5 font-display text-lg font-bold">{seatsLeft}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Desired size</p>
                      <p className="mt-0.5 font-display text-lg font-bold">{desiredSize}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                    <Avatar className="h-9 w-9 ring-2 ring-warning/30">
                      <AvatarFallback className="bg-gradient-hero text-xs font-semibold text-primary-foreground">
                        {initials(ownerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{ownerName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Project Owner{isOwner ? " · You" : ""}
                      </p>
                    </div>
                  </div>
                  {project.supervisor && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{project.supervisor.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Assigned supervisor
                          {project.supervisor.specialization
                            ? ` · ${project.supervisor.specialization}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 2 — TEAM STATUS */}
        <section>
          <SectionHeader
            icon={Users}
            eyebrow="Team Status"
            title="Team formation overview"
            desc="A real-time snapshot of how your team is forming."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Joined"
              value={`${currentMembers} / ${desiredSize}`}
              hint="Members onboarded"
            />
            <StatCard
              icon={UserPlus}
              label="Seats remaining"
              value={seatsLeft}
              hint={`${seatsLeft} more to go`}
              tone="accent"
            />
            <StatCard
              icon={Activity}
              label="Pending invites"
              value={invitationsByStatus.pending.length}
              hint="Awaiting response"
            />
            <StatCard
              icon={ShieldCheck}
              label="Readiness"
              value={readinessLabel}
              hint={project.isFull ? "Team is full" : "Formation in progress"}
              tone="accent"
            />
          </div>
          <Card className="mt-4 border-border/60 shadow-soft">
            <CardContent className="flex flex-wrap items-center justify-between gap-6 p-5">
              <div className="min-w-[220px] flex-1">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">Team completion</span>
                  <span className="text-muted-foreground">
                    {currentMembers} of {desiredSize} members joined
                  </span>
                </div>
                <Progress value={completion} className="h-2.5" />
              </div>
              <Badge className="border-0 bg-success/10 text-success">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> {readinessLabel}
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 3 — TEAM MEMBERS */}
        <section>
          <SectionHeader
            icon={Users}
            eyebrow="Team Members"
            title="Your collaborators"
            desc="The people currently building this project with you."
            action={
              canInvite ? (
                <Button
                  variant="outline"
                  className="rounded-xl border-border/70"
                  onClick={scrollToAiMatches}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Invite member
                </Button>
              ) : undefined
            }
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.members.map((m) => (
              <Card
                key={m.studentId}
                className="group relative overflow-hidden border-border/60 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                {m.role === "leader" && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-hero" />
                )}
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/15">
                      <AvatarFallback className="bg-gradient-hero text-sm font-semibold text-primary-foreground">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{m.name}</p>
                        {m.role === "leader" && (
                          <Badge className="border-0 bg-warning/10 px-1.5 py-0 text-[10px] text-warning">
                            <Crown className="mr-0.5 h-2.5 w-2.5" /> Leader
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[m.major, m.university].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="rounded-lg" disabled>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Chip>{memberDisplayRole(m)}</Chip>
                  </div>
                </CardContent>
              </Card>
            ))}
            {seatsLeft > 0 && (
              <Card className="flex items-center justify-center border-2 border-dashed border-border bg-secondary/30 p-6 text-center shadow-none">
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-foreground">{seatsLeft} open seats</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite teammates or review AI recommendations below.
                  </p>
                  {canInvite && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 rounded-lg border-border/70"
                      onClick={scrollToAiMatches}
                    >
                      Invite now
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* SECTION 4 — AI TEAMMATE RECOMMENDATIONS */}
        {canManageTeam && (
          <section ref={aiSectionRef}>
            <SectionHeader
              icon={Brain}
              eyebrow="AI Recommendations"
              title="Suggested teammates"
              desc="Ranked by skill complement, availability, and project relevance."
              action={
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => void refreshMatches()}
                  disabled={refreshingMatches}
                >
                  {refreshingMatches ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : null}
                  Refresh matches <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              }
            />
            {aiTeammates.length === 0 ? (
              <Card className="border-2 border-dashed border-border bg-secondary/30 shadow-none">
                <CardContent className="p-8 text-center">
                  <Brain className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-semibold">No recommendations yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try refreshing matches once your project profile is complete.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {aiTeammates.map((s, index) => {
                  const rank = index + 1;
                  const isTop = rank === 1;
                  return (
                    <Card
                      key={s.studentId}
                      className={`relative overflow-hidden border-border/60 shadow-soft transition hover:shadow-elevated ${isTop ? "ring-2 ring-primary/40" : ""}`}
                    >
                      {isTop && <div className="absolute inset-0 bg-gradient-ai" />}
                      <CardContent className="relative p-5">
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`border-0 ${isTop ? "bg-primary text-primary-foreground" : rank === 2 ? "bg-accent/15 text-accent" : "bg-secondary text-secondary-foreground"}`}
                          >
                            #{rank} {isTop ? "Best Match" : rank === 2 ? "Strong Match" : "Good Match"}
                          </Badge>
                          <MatchRing value={s.matchScore} />
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <Avatar className="h-11 w-11">
                            <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                              {initials(s.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[s.major, s.university].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>
                        </div>
                        {s.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {s.skills.map((k) => (
                              <Chip key={k} tone="primary">
                                {k}
                              </Chip>
                            ))}
                          </div>
                        )}
                        {s.reason?.trim() && (
                          <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-3">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                {s.reason.trim()}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          {canInvite && (
                            <Button
                              className={`flex-1 rounded-lg ${isTop ? "bg-gradient-hero text-primary-foreground hover:opacity-95" : ""}`}
                              variant={isTop ? "default" : "outline"}
                              disabled={
                                project.isFull ||
                                invitingStudentId === s.studentId ||
                                pendingInviteReceiverIds.has(s.studentId)
                              }
                              onClick={() => void handleInviteStudent(s.studentId)}
                            >
                              {invitingStudentId === s.studentId ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              ) : (
                                <UserPlus className="mr-1.5 h-4 w-4" />
                              )}{" "}
                              {pendingInviteReceiverIds.has(s.studentId)
                                ? "Invited"
                                : project.isFull
                                  ? "Team full"
                                  : "Invite"}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="rounded-lg" disabled>
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 5 — INVITATIONS */}
        {isOwner && (
          <section>
            <SectionHeader
              icon={Mail}
              eyebrow="Invitations"
              title="Manage invitations"
              desc="Track every invitation you've sent."
            />
            <Card className="border-border/60 shadow-soft">
              <CardContent className="p-5">
                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">Invitations sent</p>
                    <p className="font-display text-lg font-bold">{invitationsUsed}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">Team seats left</p>
                    <p className="font-display text-lg font-bold">{seatsLeft}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {seatsLeft === 0 ? "Team is full" : "Team not yet full"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">Acceptance rate</p>
                    <p className="font-display text-lg font-bold">
                      {acceptanceRate !== null ? `${acceptanceRate}%` : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {acceptanceRate !== null
                        ? "Based on accepted and rejected invitations"
                        : "No decided invitations yet"}
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="rounded-xl bg-secondary/60 p-1">
                    <TabsTrigger
                      value="pending"
                      className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5" /> Pending (
                      {invitationsByStatus.pending.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="accepted"
                      className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Accepted (
                      {invitationsByStatus.accepted.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="rejected"
                      className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-soft"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Rejected (
                      {invitationsByStatus.rejected.length})
                    </TabsTrigger>
                  </TabsList>

                  {(
                    [
                      {
                        val: "pending",
                        items: invitationsByStatus.pending,
                        tone: "warning",
                        icon: Clock,
                        label: "Pending",
                      },
                      {
                        val: "accepted",
                        items: invitationsByStatus.accepted,
                        tone: "success",
                        icon: CheckCircle2,
                        label: "Accepted",
                      },
                      {
                        val: "rejected",
                        items: invitationsByStatus.rejected,
                        tone: "destructive",
                        icon: XCircle,
                        label: "Rejected",
                      },
                    ] as const
                  ).map((t) => (
                    <TabsContent key={t.val} value={t.val} className="mt-4 space-y-2">
                      {t.items.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center">
                          <Mail className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                          <p className="text-sm font-semibold">
                            No {t.label.toLowerCase()} invitations
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Invite recommended students from the AI section above.
                          </p>
                        </div>
                      ) : (
                        t.items.map((i) => (
                          <div
                            key={i.invitationId}
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-secondary text-xs">
                                  {initials(i.receiverName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold">{i.receiverName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(i.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`border-0 capitalize ${t.tone === "success" ? "bg-success/10 text-success" : t.tone === "warning" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}
                              >
                                <t.icon className="mr-1 h-3 w-3" /> {i.status}
                              </Badge>
                              {t.val === "pending" && canInvite && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-lg text-xs"
                                  disabled={cancellingInvitationId === i.invitationId}
                                  onClick={() => void handleCancelInvitation(i.invitationId)}
                                >
                                  {cancellingInvitationId === i.invitationId ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </section>
        )}

        {/* SECTION 6 — SUPERVISORS */}
        {canViewSupervisors && (
          <section>
            <SectionHeader
              icon={GraduationCap}
              eyebrow="AI Supervisor Matches"
              title="Recommended supervisors"
              desc="Faculty matched to your project's domain and methodology."
            />
            {project.supervisor && (
              <Card className="mb-4 border-border/60 shadow-soft">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Current supervisor
                      </p>
                      <p className="font-display text-lg font-bold">{project.supervisor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.supervisor.specialization?.trim() ||
                          project.supervisor.department?.trim() ||
                          "—"}
                      </p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-success/10 text-success">Approved</Badge>
                </CardContent>
              </Card>
            )}
            {supervisors.length === 0 ? (
              <Card className="border-2 border-dashed border-border bg-secondary/30 shadow-none">
                <CardContent className="p-8 text-center">
                  <GraduationCap className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-semibold">No supervisor recommendations</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recommendations appear when the project leader requests matches.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {supervisors.map((s, i) => {
                  const specChips = splitSpecialization(s.specialization);
                  const requestPending = pendingSupervisorDoctorIds.has(s.doctorId);
                  return (
                    <Card
                      key={s.doctorId}
                      className={`relative overflow-hidden border-border/60 shadow-soft transition hover:shadow-elevated ${i === 0 ? "ring-2 ring-accent/40" : ""}`}
                    >
                      {i === 0 && <div className="absolute inset-0 bg-gradient-ai opacity-70" />}
                      <CardContent className="relative p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft">
                              <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-display text-lg font-bold">{s.name || "—"}</p>
                                {i === 0 && (
                                  <Badge className="border-0 bg-primary text-primary-foreground">
                                    <Award className="mr-1 h-3 w-3" /> Top match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {s.specialization || "—"}
                              </p>
                            </div>
                          </div>
                          <MatchRing value={s.matchScore} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {specChips.length > 0 ? (
                            specChips.map((c) => (
                              <Chip key={c} tone="accent">
                                {c}
                              </Chip>
                            ))
                          ) : (
                            <Chip tone="accent">—</Chip>
                          )}
                        </div>
                        {s.reason?.trim() && (
                          <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-3">
                            <div className="flex items-start gap-2">
                              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                {s.reason.trim()}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Button
                            className={`flex-1 rounded-lg ${i === 0 ? "bg-gradient-hero text-primary-foreground hover:opacity-95" : ""}`}
                            variant={i === 0 ? "default" : "outline"}
                            disabled={
                              Boolean(project.supervisor) ||
                              requestPending ||
                              requestingDoctorId === s.doctorId
                            }
                            onClick={() => void handleRequestSupervisor(s.doctorId)}
                          >
                            {requestingDoctorId === s.doctorId ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Briefcase className="mr-1.5 h-4 w-4" />
                            )}
                            {project.supervisor
                              ? "Supervisor assigned"
                              : requestPending
                                ? "Request pending"
                                : "Request Supervision"}
                          </Button>
                          <Button variant="ghost" className="rounded-lg" disabled>
                            View profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <footer className="pb-4 pt-6 text-center text-xs text-muted-foreground">
          SkillSwap · Graduation Workspace · Designed for focused academic collaboration
        </footer>
      </main>

      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
        >
          <Card className="w-full max-w-md border-border/60 shadow-elevated">
            <CardContent className="p-6">
              <h2 id="delete-project-title" className="font-display text-lg font-bold text-foreground">
                Delete graduation project?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently delete &ldquo;{project.name}&rdquo; and its team data. This
                action cannot be undone.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={deletingProject}
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-xl"
                  disabled={deletingProject}
                  onClick={() => void handleDeleteProject()}
                >
                  {deletingProject ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
