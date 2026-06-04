import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  GraduationCap,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { getMe } from "@/api/meApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getGraduationProjectsMyEnvelope,
  getBrowseProjectTypeFilters,
  joinGraduationProject,
  listGraduationProjects,
  type GradProject,
} from "@/api/gradProjectApi";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/components/ui/utils";
import {
  collectBrowseSkillOptions,
  computeSkillMatchScore,
  getBrowseTeamStatus,
  isBrowseableProject,
  projectTypeLabel,
  type BrowseTeamStatus,
} from "@/lib/browseProjectsUtils";
import type { GraduationProjectType } from "@/lib/graduationProjectTypes";
import "@/styles/student-hub.css";
import "@/styles/student-workspace-pages.css";

type ProjectTypeFilter = "All" | GraduationProjectType;
const TEAM_STATUSES: BrowseTeamStatus[] = ["Open", "Forming team", "Almost full"];
type SortKey = "match" | "newest" | "open";

type BrowseRow = GradProject & { matchScore: number; teamStatus: BrowseTeamStatus };

function FilterPill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "student-ws-pill",
        active && "student-ws-pill--active",
      )}
    >
      {children}
    </button>
  );
}

function mergeMySkills(me: Awaited<ReturnType<typeof getMe>>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [
    ...(me.roles ?? []),
    ...(me.technicalSkills ?? []),
    ...(me.tools ?? []),
    ...(me.generalSkills ?? []),
    ...(me.majorSkills ?? []),
  ]) {
    const t = s.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export default function StudentBrowseProjectsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deepLinkProjectId = Number(searchParams.get("projectId") ?? 0);
  const [loading, setLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);
  const [myProfileId, setMyProfileId] = useState(0);
  const [myFaculty, setMyFaculty] = useState<string | null>(null);
  const [myMajor, setMyMajor] = useState<string | null>(null);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<GradProject[]>([]);
  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState<ProjectTypeFilter>("All");
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BrowseTeamStatus | null>(null);
  const [sort, setSort] = useState<SortKey>("match");
  const [detail, setDetail] = useState<BrowseRow | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, envelope, rows] = await Promise.all([
        getMe(),
        getGraduationProjectsMyEnvelope(),
        listGraduationProjects(),
      ]);
      setMyProfileId(me.profileId);
      setMyFaculty(me.faculty ?? null);
      setMyMajor(me.major ?? null);
      setMySkills(mergeMySkills(me));
      setHasTeam(envelope.role === "owner" || envelope.role === "member");
      setProjects(rows);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load projects",
        description: parseApiErrorMessage(err),
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const projectTypeFilters = useMemo(
    () => getBrowseProjectTypeFilters(myFaculty, myMajor),
    [myFaculty, myMajor],
  );

  const skillOptions = useMemo(() => collectBrowseSkillOptions(projects), [projects]);

  const rows = useMemo((): BrowseRow[] => {
    if (hasTeam || !myProfileId) return [];
    return projects
      .filter((p) => isBrowseableProject(p, myProfileId, myFaculty, myMajor))
      .map((p) => ({
        ...p,
        matchScore: computeSkillMatchScore(mySkills, p.requiredSkills),
        teamStatus: getBrowseTeamStatus(p),
      }));
  }, [hasTeam, myProfileId, myFaculty, myMajor, projects, mySkills]);

  useEffect(() => {
    if (!deepLinkProjectId || loading || hasTeam || rows.length === 0) return;
    const match = rows.find((p) => p.id === deepLinkProjectId);
    if (match) setDetail(match);
  }, [deepLinkProjectId, loading, hasTeam, rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (projectType !== "All") {
      list = list.filter((p) => (p.projectType ?? "GP") === projectType);
    }
    if (skillFilter) {
      list = list.filter((p) => {
        const skills = [...(p.requiredSkills ?? []), ...(p.technologies ?? [])];
        return skills.some((s) => s.toLowerCase() === skillFilter.toLowerCase());
      });
    }
    if (statusFilter) {
      list = list.filter((p) => p.teamStatus === statusFilter);
    }
    if (q) {
      list = list.filter((p) => {
        const hay = [
          p.name,
          p.abstract ?? "",
          p.ownerName ?? "",
          ...(p.requiredSkills ?? []),
          ...(p.technologies ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...list];
    if (sort === "match") {
      sorted.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sort === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      );
    } else {
      sorted.sort((a, b) => {
        const ar =
          a.remainingSeats ??
          Math.max(0, a.partnersCount - (a.currentMembers ?? a.members.length));
        const br =
          b.remainingSeats ??
          Math.max(0, b.partnersCount - (b.currentMembers ?? b.members.length));
        return br - ar;
      });
    }
    return sorted;
  }, [rows, search, projectType, skillFilter, statusFilter, sort]);

  const handleJoin = async (projectId: number) => {
    setJoiningId(projectId);
    try {
      await joinGraduationProject(projectId);
      toast({
        title: "Joined project",
        description: "You are now on the graduation project team.",
      });
      setDetail(null);
      navigate(ROUTES.graduationProjectWorkspace);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not join project",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="student-hub flex min-h-full items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      </div>
    );
  }

  if (hasTeam) {
    return (
      <div className="student-hub min-h-full bg-hero">
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            You already belong to a graduation project
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Browse Projects is available only for students who have not joined a graduation
            project.
          </p>
          <Button className="mt-8 bg-gradient-primary font-semibold" size="lg" asChild>
            <Link to={ROUTES.graduationProjectWorkspace}>Go to My Graduation Project</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-hub min-h-full bg-hero">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="student-ws-page-header">
          <div>
            <p className="student-ws-eyebrow">Discover</p>
            <h1 className="student-ws-title">Browse graduation projects</h1>
            <p className="student-ws-description">
              Find projects that match your skills, interests, and ambitions for this term.
            </p>
          </div>
        </header>

        <div className="student-ws-surface p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, keyword, or skill…"
                className="student-ws-input pl-10"
                aria-label="Search projects"
              />
            </div>
            <button type="button" className="student-ws-btn-outline gap-1.5" disabled>
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Advanced
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <p className="student-ws-filter-label">Project type</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {projectTypeFilters.map(({ value, label }) => (
                  <FilterPill
                    key={value}
                    active={projectType === value}
                    onClick={() => setProjectType(value)}
                  >
                    {label}
                  </FilterPill>
                ))}
              </div>
            </div>
            {skillOptions.length > 0 && (
              <div>
                <p className="student-ws-filter-label">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skillOptions.map((s) => (
                    <FilterPill
                      key={s}
                      active={skillFilter === s}
                      onClick={() => setSkillFilter(skillFilter === s ? null : s)}
                    >
                      {s}
                    </FilterPill>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="student-ws-filter-label">Team status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TEAM_STATUSES.map((s) => (
                  <FilterPill
                    key={s}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  >
                    {s}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> projects
            match your filters
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="student-ws-select"
            aria-label="Sort projects"
          >
            <option value="match">Sort: AI match</option>
            <option value="newest">Newest</option>
            <option value="open">Open positions</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="student-ws-surface mt-4 flex flex-col items-center px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold text-foreground">No projects found</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try adjusting your search or filters, or check back when new teams are recruiting.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => {
              const open =
                p.remainingSeats ??
                Math.max(0, p.partnersCount - (p.currentMembers ?? p.members.length));
              const skills = [...(p.requiredSkills ?? []), ...(p.technologies ?? [])].slice(
                0,
                4,
              );
              return (
                <article key={p.id} className="student-ws-card group flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="student-ws-chip">{projectTypeLabel(p, myFaculty, myMajor)}</span>
                    <span className="student-ws-chip student-ws-chip--primary">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      {p.matchScore}% match
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold leading-snug">{p.name}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {p.abstract?.trim() || "No abstract provided yet."}
                  </p>
                  {skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <span key={s} className="student-ws-chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {p.partnersCount} max
                      </span>
                      <span className="font-semibold text-foreground">{open} open</span>
                    </div>
                    <span
                      className={cn(
                        "student-ws-chip",
                        p.teamStatus === "Open" && "student-ws-chip--success",
                        p.teamStatus === "Forming team" && "student-ws-chip--accent",
                        p.teamStatus === "Almost full" && "student-ws-chip--warning",
                      )}
                    >
                      {p.teamStatus}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="student-ws-btn-primary mt-4 gap-1.5"
                    onClick={() => setDetail(p)}
                  >
                    View project
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="browse-project-title"
        >
          <div className="student-ws-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="student-ws-eyebrow">{projectTypeLabel(detail, myFaculty, myMajor)}</p>
                <h2 id="browse-project-title" className="font-display text-xl font-bold">
                  {detail.name}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                aria-label="Close"
                onClick={() => setDetail(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {detail.abstract?.trim() || "No abstract provided."}
            </p>
            {detail.ownerName && (
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Led by </span>
                <span className="font-medium text-foreground">{detail.ownerName}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />
              {detail.matchScore}% skill match · {detail.teamStatus}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                className="bg-gradient-primary font-semibold"
                disabled={joiningId === detail.id}
                onClick={() => void handleJoin(detail.id)}
              >
                {joiningId === detail.id ? "Joining…" : "Join project team"}
              </Button>
              <Button variant="outline" onClick={() => setDetail(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
