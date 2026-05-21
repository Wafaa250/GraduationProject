import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Star, Users, X } from "lucide-react";

import {
  fetchBrowseStudentFilters,
  fetchBrowseStudents,
  fetchGraduationProjectBrowseContext,
  parseBrowseProjectId,
  type BrowseStudentDto,
} from "../../../api/studentsBrowseApi";
import { sendInvitation } from "../../../api/invitationsApi";
import { useUser } from "../../../context/UserContext";
import { useToast } from "../../../context/ToastContext";
import { getProfileUrl } from "../../components/common/ProfileLink";
import { PageHeader } from "../../components/design-system";
import { Button } from "../../components/ui/button";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { BrowseStudentCard } from "./components/BrowseStudentCard";

const BEST_MATCH_THRESHOLD = 60;

export default function StudentsPage() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const projectId = parseBrowseProjectId(searchParams.get("projectId"));

  const [searchQuery, setSearchQuery] = useState("");
  const globalSearchWrapRef = useRef<HTMLDivElement>(null);
  const [students, setStudents] = useState<BrowseStudentDto[]>([]);
  const [filters, setFilters] = useState({
    universities: [] as string[],
    majors: [] as string[],
    skills: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [skill, setSkill] = useState("");
  const [isTeamFull, setIsTeamFull] = useState(false);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    fetchGraduationProjectBrowseContext(projectId)
      .then((ctx) => {
        setProjectName(ctx.name);
        setIsTeamFull(ctx.isFull);
      })
      .catch(() => undefined);
  }, [projectId]);

  const handleInvite = async (student: BrowseStudentDto) => {
    if (!projectId) return;
    if (isTeamFull || student.isMember || student.hasPendingInvite || !student.canInvite) return;
    setInvitingId(student.profileId);
    try {
      await sendInvitation(projectId, student.profileId);
      setStudents((prev) =>
        prev.map((s) =>
          s.profileId === student.profileId ? { ...s, hasPendingInvite: true } : s,
        ),
      );
      showToast("Invitation sent", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send invitation.";
      showToast(msg, "error");
    } finally {
      setInvitingId(null);
    }
  };

  useEffect(() => {
    fetchBrowseStudentFilters()
      .then(setFilters)
      .catch(() => undefined);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchBrowseStudents(
        { search, university, major, skill },
        projectId,
      );
      setStudents(list);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [search, university, major, skill, projectId]);

  useEffect(() => {
    const t = setTimeout(() => void fetchStudents(), 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const clearFilters = () => {
    setSearch("");
    setUniversity("");
    setMajor("");
    setSkill("");
  };

  const hasActiveFilters = Boolean(search || university || major || skill);
  const activeCount = [university, major, skill].filter(Boolean).length;

  const sorted = [...students].sort((a, b) => b.matchScore - a.matchScore);
  const recommended = sorted.filter((s) => s.matchScore >= BEST_MATCH_THRESHOLD);
  const others = sorted.filter((s) => s.matchScore < BEST_MATCH_THRESHOLD);

  const countLabel = loading
    ? "Loading…"
    : `${students.length} student${students.length !== 1 ? "s" : ""} found`;

  const renderCard = (s: BrowseStudentDto, highlight?: boolean) => {
    const profileHref =
      getProfileUrl({ role: "student", userId: s.userId }) ?? "/students";
    return (
      <BrowseStudentCard
        key={s.userId}
        student={s}
        profileHref={profileHref}
        highlight={highlight}
        onInvite={projectId ? () => void handleInvite(s) : undefined}
        isTeamFull={isTeamFull}
        isSending={invitingId === s.profileId}
      />
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const shellProps = {
    userName: profile.fullName,
    profilePic: profile.profilePic,
    gradProjectId: projectId,
    searchQuery,
    onSearchChange: setSearchQuery,
    searchWrapRef: globalSearchWrapRef,
    globalSearchResults: null,
    globalSearchLoading: false,
    onSelectStudent: (id: number) => navigate(`/students/${id}`),
    onSelectDoctor: (id: number) => navigate(`/doctors/${id}`),
    onOpenSettings: () => navigate("/edit-profile"),
    onLogout: handleLogout,
  };

  return (
    <StudentDashboardShell {...shellProps}>
      <PageHeader
        eyebrow="Find teammates"
        title="Browse Students"
        description={countLabel + (hasActiveFilters ? " · Filters active" : "")}
        actions={
          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            ) : null}
            <Button
              type="button"
              variant={filtersOpen ? "secondary" : "outline"}
              size="sm"
              className="relative"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-primary text-[9px] font-bold text-primary-foreground">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </div>
        }
      />

      {projectId ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>
            Browsing for <strong>{projectName ?? `Project #${projectId}`}</strong>
            {" "}— invite teammates to your graduation project
          </span>
        </div>
      ) : null}

      {projectId && isTeamFull ? (
        <p className="mb-4 inline-flex rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
          Team is full — no more invitations can be sent
        </p>
      ) : null}

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {filtersOpen ? (
        <div className="mb-4 grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-3 md:p-5">
          {[
            {
              label: "University",
              value: university,
              set: setUniversity,
              opts: filters.universities,
              ph: "All universities",
            },
            {
              label: "Major",
              value: major,
              set: setMajor,
              opts: filters.majors,
              ph: "All majors",
            },
            {
              label: "Skill",
              value: skill,
              set: setSkill,
              opts: filters.skills,
              ph: "All skills",
            },
          ].map((f) => (
            <div key={f.label}>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {f.label}
              </label>
              <select
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                <option value="">{f.ph}</option>
                {f.opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : null}

      {hasActiveFilters && (university || major || skill) ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {university ? (
            <FilterChip label={university} onRemove={() => setUniversity("")} />
          ) : null}
          {major ? <FilterChip label={major} onRemove={() => setMajor("")} /> : null}
          {skill ? <FilterChip label={skill} onRemove={() => setSkill("")} /> : null}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Finding students…</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground/50" />
          <p className="font-display mt-3 font-semibold text-foreground">No students found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or search
          </p>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <SectionHeading
              icon={<Star className="h-4 w-4 text-warning" />}
              title="Best matches for your project"
              count={recommended.length}
            />
            {recommended.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                No students with a high match score yet.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {recommended.map((s) => renderCard(s, true))}
              </div>
            )}
          </section>

          {others.length > 0 ? (
            <section>
              <SectionHeading
                icon={<Users className="h-4 w-4 text-primary" />}
                title="Other students"
                count={others.length}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {others.map((s) => renderCard(s))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </StudentDashboardShell>
  );
}

function SectionHeading({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </h2>
      <span className="text-xs text-muted-foreground">
        {count} student{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-primary/15"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
