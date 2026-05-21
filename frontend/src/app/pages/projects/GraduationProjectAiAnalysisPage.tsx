import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  GraduationCap,
  Loader2,
  Pencil,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
  fetchSupervisorRecommendations,
  getGraduationProjectById,
  getRecommendedStudents,
  type GradProject,
  type GradProjectRecommendedStudent,
  type GradProjectRecommendedSupervisor,
} from "../../../api/gradProjectApi";
import { sendInvitation } from "../../../api/invitationsApi";
import { requestSupervisor } from "../../../api/supervisorApi";
import { useUser, normalizeSkillStringList } from "../../../context/UserContext";
import { useToast } from "../../../context/ToastContext";
import {
  PageHeader,
  SkillChip,
  SupervisorMatchCard,
  TeammateMatchCard,
} from "../../components/design-system";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { Button } from "../../components/ui/button";

function parseStoredAbstract(raw: string | null | undefined): {
  projectField: string;
  problem: string;
} {
  const text = (raw ?? "").trim();
  if (!text) return { projectField: "", problem: "" };
  let body = text;
  const supMatch = body.match(/\n\nSupervisor preferences:\s*([\s\S]+)$/i);
  if (supMatch) body = body.slice(0, supMatch.index).trim();
  const domainMatch = body.match(/^Domain:\s*(.+?)\n\n([\s\S]+)$/i);
  if (domainMatch) {
    return { projectField: domainMatch[1].trim(), problem: domainMatch[2].trim() };
  }
  return { projectField: "", problem: body };
}

function skillNamesOverlap(required: string, owned: string): boolean {
  const a = required.toLowerCase().trim();
  const b = owned.toLowerCase().trim();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function profileSkillSet(profile: {
  roles: string[];
  technicalSkills: string[];
  tools: string[];
}): string[] {
  return [
    ...normalizeSkillStringList(profile.roles),
    ...normalizeSkillStringList(profile.technicalSkills),
    ...normalizeSkillStringList(profile.tools),
  ];
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function computeReadiness(
  project: GradProject,
  missingCount: number,
): { grade: string; hint: string } {
  const abstractLen = (project.abstract ?? "").trim().length;
  const skillsN = project.requiredSkills?.length ?? 0;
  let pts = 42;
  pts += Math.min(22, Math.floor(abstractLen / 45));
  pts += Math.min(18, skillsN * 2);
  pts += Math.min(12, Math.max(0, 6 - missingCount) * 2);
  pts = Math.min(100, Math.round(pts));
  let grade = "C";
  if (pts >= 92) grade = "A";
  else if (pts >= 86) grade = "A-";
  else if (pts >= 78) grade = "B+";
  else if (pts >= 70) grade = "B";
  else if (pts >= 62) grade = "B-";
  else if (pts >= 54) grade = "C+";
  const hint =
    missingCount > 2
      ? "Strong idea, gaps in several skill areas."
      : missingCount > 0
        ? "Solid plan — close skill gaps with teammates."
        : "Great alignment between your profile and project needs.";
  return { grade, hint };
}

function roleCardFromSkill(skill: string): { role: string; reason: string } {
  const s = skill.toLowerCase();
  if (s.includes("flutter") || s.includes("mobile") || s.includes("ios") || s.includes("android"))
    return { role: "Mobile lead", reason: `Owns ${skill} delivery for the project.` };
  if (s.includes("nlp") || s.includes("ml") || s.includes("ai") || s.includes("machine learning"))
    return { role: "ML / NLP engineer", reason: `Builds ${skill} features and models.` };
  if (s.includes("ux") || s.includes("ui") || s.includes("design"))
    return { role: "UX researcher", reason: `Validates ${skill} with real users.` };
  if (s.includes("backend") || s.includes("api") || s.includes("server"))
    return { role: "Backend engineer", reason: `Owns ${skill} APIs and data layer.` };
  if (s.includes("frontend") || s.includes("react") || s.includes("web"))
    return { role: "Frontend engineer", reason: `Ships ${skill} interfaces and client logic.` };
  return {
    role: `${skill.length > 22 ? `${skill.slice(0, 20)}…` : skill} lead`,
    reason: `Drives delivery around ${skill}.`,
  };
}

function supervisorExpertise(
  specialization: string,
  required: string[],
): string[] {
  const spec = specialization.trim();
  if (!spec) return required.slice(0, 3);
  const specLower = spec.toLowerCase();
  const matched = required.filter((s) => specLower.includes(s.toLowerCase().trim()));
  if (matched.length > 0) return matched.slice(0, 4);
  const parts = spec.split(/[,;|/]/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts.slice(0, 4) : required.slice(0, 3);
}

/** Same rule as Dashboard “Find Best Teammates (AI)” (owner or team leader). */
function canTriggerAiTeammates(
  p: GradProject,
  studentProfileId: number | null,
): boolean {
  if (p.isOwner) return true;
  if (studentProfileId != null && p.ownerId === studentProfileId) return true;
  return (
    studentProfileId != null &&
    (p.members ?? []).some(
      (m) => m.studentId === studentProfileId && m.role === "leader",
    )
  );
}

export default function GraduationProjectAiAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = Number(searchParams.get("projectId") ?? "0");
  const { profile } = useUser();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const globalSearchWrapRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<GradProject | null>(null);

  const [teammates, setTeammates] = useState<GradProjectRecommendedStudent[]>([]);
  const [teammatesState, setTeammatesState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [teammatesErr, setTeammatesErr] = useState<string | null>(null);

  const [supervisors, setSupervisors] = useState<GradProjectRecommendedSupervisor[]>([]);
  const [supervisorsState, setSupervisorsState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [supervisorsErr, setSupervisorsErr] = useState<string | null>(null);

  const [inviteId, setInviteId] = useState<number | null>(null);
  const [requestDocId, setRequestDocId] = useState<number | null>(null);

  const myProfileSkills = useMemo(() => profileSkillSet(profile), [profile]);

  const loadAiTeammates = useCallback(
    async (p: GradProject) => {
      const profileId = profile.studentProfileId;
      if (!canTriggerAiTeammates(p, profileId)) {
        setTeammates([]);
        setTeammatesState("done");
        setTeammatesErr(null);
        return;
      }

      setTeammatesState("loading");
      setTeammatesErr(null);
      try {
        const result = await getRecommendedStudents(p.id);
        const memberIds = new Set((p.members ?? []).map((m) => m.studentId));
        setTeammates(
          result.map((row) => ({
            ...row,
            isMember: memberIds.has(row.studentId),
          })),
        );
        setTeammatesState(result.length > 0 ? "done" : "done");
      } catch (e) {
        setTeammatesErr(parseApiErrorMessage(e));
        setTeammates([]);
        setTeammatesState("error");
      }
    },
    [profile.studentProfileId],
  );

  const loadAiSupervisors = useCallback(
    async (p: GradProject) => {
      const profileId = profile.studentProfileId;
      const isLeader = canTriggerAiTeammates(p, profileId);
      if (!isLeader) {
        setSupervisors([]);
        setSupervisorsState("done");
        setSupervisorsErr(null);
        return;
      }

      setSupervisorsState("loading");
      setSupervisorsErr(null);
      try {
        const sup = await fetchSupervisorRecommendations(
          p.id,
          p.requiredSkills ?? [],
          { studentMajor: profile.major },
        );
        setSupervisors(sup);
        setSupervisorsState("done");
      } catch (e) {
        setSupervisorsErr(parseApiErrorMessage(e));
        setSupervisors([]);
        setSupervisorsState("error");
      }
    },
    [profile.studentProfileId, profile.major],
  );

  const loadAi = useCallback(
    async (p: GradProject) => {
      await Promise.all([loadAiTeammates(p), loadAiSupervisors(p)]);
    },
    [loadAiTeammates, loadAiSupervisors],
  );

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setError("Missing or invalid project.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getGraduationProjectById(projectId);
        if (cancelled) return;
        setProject(p);
        await loadAi(p);
      } catch (e) {
        if (!cancelled) setError(parseApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, loadAi]);

  const parsed = useMemo(
    () => parseStoredAbstract(project?.abstract ?? null),
    [project?.abstract],
  );

  const required = project?.requiredSkills ?? [];

  const missingSkills = useMemo(() => {
    return required.filter(
      (req) =>
        !myProfileSkills.some((owned) => skillNamesOverlap(req, owned)),
    );
  }, [required, myProfileSkills]);

  const { grade, hint } = useMemo(
    () =>
      project
        ? computeReadiness(project, missingSkills.length)
        : { grade: "—", hint: "" },
    [project, missingSkills.length],
  );

  const roleCards = useMemo(() => {
    const uniq = [...new Set(required)];
    return uniq.slice(0, 3).map((skill) => ({
      skill,
      ...roleCardFromSkill(skill),
    }));
  }, [required]);

  const detectedField =
    parsed.projectField.trim() ||
    (project?.projectType ? `${project.projectType}` : "—");

  const summaryText =
    parsed.problem.trim() ||
    (project?.abstract ?? "").trim() ||
    "Add a richer problem description on the edit screen to improve matching.";

  const isProjectLeader = useMemo(() => {
    if (!project) return false;
    return canTriggerAiTeammates(project, profile.studentProfileId);
  }, [project, profile.studentProfileId]);

  const isProjectOwner = useMemo(() => {
    if (!project) return false;
    if (project.isOwner) return true;
    const pid = profile.studentProfileId;
    return pid != null && project.ownerId === pid;
  }, [project, profile.studentProfileId]);

  const openSeats =
    project != null
      ? (project.remainingSeats ??
        Math.max(0, project.partnersCount - project.currentMembers))
      : 0;

  const teamSizeLabel = project
    ? `${project.partnersCount} members · ${
        project.isFull
          ? "team full"
          : `${openSeats} seat${openSeats === 1 ? "" : "s"} open`
      }`
    : "";

  const handleInvite = async (studentProfileId: number) => {
    if (!project || !isProjectOwner || project.isFull) return;
    setInviteId(studentProfileId);
    try {
      await sendInvitation(project.id, studentProfileId);
      showToast("Invitation sent.", "success");
      if (project) await loadAi(project);
    } catch (e) {
      showToast(parseApiErrorMessage(e), "error");
    } finally {
      setInviteId(null);
    }
  };

  const handleRequestSupervisor = async (doctorId: number) => {
    if (!project || project.supervisor) return;
    setRequestDocId(doctorId);
    try {
      await requestSupervisor(project.id, doctorId);
      showToast("Supervision request sent.", "success");
      const p = await getGraduationProjectById(project.id);
      setProject(p);
      await loadAi(p);
    } catch (e) {
      showToast(parseApiErrorMessage(e), "error");
    } finally {
      setRequestDocId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const shellProps = {
    userName: profile.fullName,
    profilePic: profile.profilePic,
    gradProjectId: project?.id ?? null,
    searchQuery,
    onSearchChange: setSearchQuery,
    searchWrapRef: globalSearchWrapRef,
    globalSearchResults: null as const,
    globalSearchLoading: false,
    onSelectStudent: (id: number) => navigate(`/students/${id}`),
    onSelectDoctor: (id: number) => navigate(`/doctors/${id}`),
    onOpenSettings: () => {},
    onLogout: handleLogout,
  };

  if (!Number.isFinite(projectId) || projectId <= 0) {
    return (
      <StudentDashboardShell {...shellProps}>
        <div className="max-w-lg rounded-2xl border border-border bg-card p-8 shadow-soft">
          <p className="text-sm text-muted-foreground">
            Invalid link. Open your project from the dashboard.
          </p>
          <Button className="mt-4" variant="gradient" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </StudentDashboardShell>
    );
  }

  if (loading) {
    return (
      <StudentDashboardShell {...shellProps}>
        <div className="flex items-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-ai" />
          <span className="text-sm font-medium">Loading AI analysis…</span>
        </div>
      </StudentDashboardShell>
    );
  }

  if (error || !project) {
    return (
      <StudentDashboardShell {...shellProps}>
        <div className="max-w-lg rounded-2xl border border-destructive/20 bg-destructive/5 p-8 shadow-soft">
          <p className="text-sm font-medium text-destructive">{error ?? "Project not found."}</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </StudentDashboardShell>
    );
  }

  return (
    <StudentDashboardShell {...shellProps}>
      <PageHeader
        eyebrow="AI Project Analysis"
        title={project.name}
        description="Here's how the matcher reads your project — and who fits."
        actions={
          project.isOwner ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate("/create-project/edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit project
            </Button>
          ) : null
        }
      />

      {/* Top summary — matches reference AIAnalysis */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-ai/20 bg-gradient-to-br from-ai-soft via-card to-card p-6 shadow-ai sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-ai opacity-20 blur-3xl"
        />
        <div className="relative grid items-start gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ai/30 bg-card px-3 py-1 text-xs font-semibold text-ai">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Analysis complete
            </div>
            <h2 className="mt-3 font-display text-xl font-bold">Project summary</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summaryText}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Detected field
                </p>
                <p className="mt-1 font-display font-semibold">{detectedField}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Suggested team size
                </p>
                <p className="mt-1 font-display font-semibold">{teamSizeLabel}</p>
              </div>
            </div>
          </div>
          <div className="min-w-[200px] rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Project readiness
            </p>
            <p className="mt-1 font-display text-4xl font-bold gradient-text-ai">{grade}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold">Required skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {required.length === 0 ? (
              <span className="text-sm text-muted-foreground">No skills listed yet.</span>
            ) : (
              required.map((sk) => {
                const has = myProfileSkills.some((owned) =>
                  skillNamesOverlap(sk, owned),
                );
                return (
                  <SkillChip
                    key={sk}
                    label={sk}
                    variant={has ? "have" : "default"}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="font-display font-semibold">Missing in your team</h3>
          </div>
          {missingSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your profile covers every required skill for this project.
            </p>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-2">
                {missingSkills.map((sk) => (
                  <SkillChip key={sk} label={sk} variant="missing" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {missingSkills.length} critical gap{missingSkills.length === 1 ? "" : "s"}.
                We&apos;ve shortlisted students who close them.
              </p>
            </>
          )}
        </div>
      </div>

      {roleCards.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-display font-semibold">Suggested team roles</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {roleCards.map(({ skill, role, reason }) => (
              <div
                key={skill}
                className="rounded-xl border border-border bg-background p-3"
              >
                <p className="font-display text-sm font-semibold">{role}</p>
                <p className="mt-1 text-xs text-muted-foreground">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-bold">Suggested teammates</h3>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <Link to="/students">Browse all</Link>
          </Button>
        </div>

        {teammatesState === "loading" ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-ai" />
            Finding teammates…
          </div>
        ) : teammatesErr ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {teammatesErr}
          </p>
        ) : teammates.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">
              No teammate matches yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isProjectLeader
                ? "No students with relevant skills were found. Adjust required skills on Edit project and reopen this page."
                : "Only the project owner or team leader can load AI teammate suggestions."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teammates.map((row) => {
              const inviteBlocked =
                project.isFull || row.isMember || row.hasPendingInvite;
              const inviteLabel = row.isMember
                ? "On team"
                : row.hasPendingInvite
                  ? "Invited"
                  : project.isFull
                    ? "Team full"
                    : "Invite";

              return (
                <TeammateMatchCard
                  key={row.studentId}
                  userId={row.userId}
                  studentProfileId={row.studentId}
                  name={row.name}
                  subtitle={[row.major, row.academicYear, row.university]
                    .filter(Boolean)
                    .join(" · ")}
                  initials={initials(row.name)}
                  profilePicture={row.profilePicture}
                  matchScore={row.matchScore}
                  skills={row.skills ?? []}
                  matchReason={row.reason}
                  onInvite={
                    isProjectOwner
                      ? () => void handleInvite(row.studentId)
                      : undefined
                  }
                  inviteLoading={inviteId === row.studentId}
                  inviteDisabled={inviteBlocked}
                  inviteLabel={inviteLabel}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="pb-8">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-accent" />
          <h3 className="font-display text-lg font-bold">Suggested supervisors</h3>
        </div>

        {supervisorsState === "loading" ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-ai" />
            Finding supervisors…
          </div>
        ) : supervisorsErr ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {supervisorsErr}
          </p>
        ) : !isProjectLeader ? (
          <p className="text-sm text-muted-foreground">
            Only the project leader can view supervisor matches and send requests.
          </p>
        ) : supervisors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No supervisor recommendations yet. Browse doctors from Find Supervisor on the dashboard.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {supervisors.map((doc) => (
              <SupervisorMatchCard
                key={doc.doctorId}
                userId={doc.userId}
                name={doc.name}
                department={doc.specialization || "Faculty"}
                initials={initials(doc.name)}
                matchScore={doc.matchScore}
                expertise={supervisorExpertise(doc.specialization, required)}
                matchReason={
                  doc.reason?.trim() ||
                  `Match score ${doc.matchScore}% from project skill alignment.`
                }
                onRequest={
                  isProjectLeader && !project.supervisor
                    ? () => void handleRequestSupervisor(doc.doctorId)
                    : undefined
                }
                requestLoading={requestDocId === doc.doctorId}
                requestDisabled={!isProjectLeader || !!project.supervisor}
              />
            ))}
          </div>
        )}
      </section>
    </StudentDashboardShell>
  );
}
