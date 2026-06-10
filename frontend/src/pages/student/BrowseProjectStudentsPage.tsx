import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, UserPlus, Users, X } from "lucide-react";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  getAvailableStudents,
  getGraduationProjectById,
  getGraduationProjectsMyEnvelope,
  inviteStudentToProject,
  type ProjectAvailableStudent,
} from "@/api/gradProjectApi";
import { getStudentBrowseFilterOptions } from "@/api/studentProfileApi";
import { StudentBrowseFilterPill } from "@/components/student/browse/StudentBrowseFilterPill";
import { Button } from "@/components/ui/button";
import { PROFILE_AVATAR_FALLBACK_CLASS } from "@/lib/profileAvatar";
import {
  filterAvailableStudents,
  splitStudentsByMatchScore,
} from "@/lib/browseAvailableStudentsUtils";
import { cn } from "@/components/ui/utils";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import "@/styles/student-hub.css";
import "@/styles/student-workspace-pages.css";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function inviteDisabledReason(
  student: ProjectAvailableStudent,
  isTeamFull: boolean,
): string | null {
  if (isTeamFull || student.isProjectFull) return "Team full";
  if (student.isMember) return "Member";
  if (student.hasPendingInvite) return "Pending";
  if (!student.canInvite) return "Unavailable";
  return null;
}

function StudentInviteCard({
  student,
  isTeamFull,
  invitingId,
  onInvite,
}: {
  student: ProjectAvailableStudent;
  isTeamFull: boolean;
  invitingId: number | null;
  onInvite: (student: ProjectAvailableStudent) => void;
}) {
  const disabledReason = inviteDisabledReason(student, isTeamFull);
  const isSending = invitingId === student.studentId;

  return (
    <article className="student-ws-card flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              PROFILE_AVATAR_FALLBACK_CLASS,
            )}
          >
            {initials(student.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-semibold">{student.name}</h2>
            <p className="truncate text-xs text-muted-foreground">{student.major || "—"}</p>
          </div>
        </div>
        {student.matchScore > 0 && (
          <span className="student-ws-chip student-ws-chip--primary shrink-0">
            <Sparkles className="h-3 w-3" aria-hidden />
            {student.matchScore}%
          </span>
        )}
      </div>
      {(student.university || student.academicYear) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {[student.university, student.academicYear].filter(Boolean).join(" · ")}
        </p>
      )}
      {student.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {student.skills.slice(0, 4).map((s) => (
            <span key={s} className="student-ws-chip">
              {s}
            </span>
          ))}
          {student.skills.length > 4 && (
            <span className="student-ws-chip">+{student.skills.length - 4}</span>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button variant="outline" size="sm" className="rounded-lg" asChild>
          <Link to={ROUTES.studentDirectoryProfile(student.userId)}>View profile</Link>
        </Button>
        {disabledReason ? (
          <Button size="sm" className="rounded-lg" disabled>
            {disabledReason}
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-lg bg-gradient-primary font-semibold"
            disabled={isSending}
            onClick={() => onInvite(student)}
          >
            {isSending ? "Sending…" : (
              <>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Invite
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}

function StudentSection({
  title,
  count,
  students,
  isTeamFull,
  invitingId,
  onInvite,
}: {
  title: string;
  count: number;
  students: ProjectAvailableStudent[];
  isTeamFull: boolean;
  invitingId: number | null;
  onInvite: (student: ProjectAvailableStudent) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground">{count} students</span>
      </div>
      {students.length === 0 ? (
        <div className="student-ws-surface px-4 py-10 text-center text-sm text-muted-foreground">
          No students in this group.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => (
            <StudentInviteCard
              key={s.studentId}
              student={s}
              isTeamFull={isTeamFull}
              invitingId={invitingId}
              onInvite={onInvite}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function BrowseProjectStudentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = Number(searchParams.get("projectId") ?? 0);
  const validProjectId = Number.isFinite(projectId) && projectId > 0;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<ProjectAvailableStudent[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isTeamFull, setIsTeamFull] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    universities: [] as string[],
    majors: [] as string[],
    skills: [] as string[],
  });
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [skill, setSkill] = useState("");
  const [invitingId, setInvitingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!validProjectId) {
      navigate(ROUTES.graduationProjectWorkspace, { replace: true });
      return;
    }
    setLoading(true);
    try {
      const [envelope, project, rows, filters] = await Promise.all([
        getGraduationProjectsMyEnvelope(),
        getGraduationProjectById(projectId),
        getAvailableStudents(projectId),
        getStudentBrowseFilterOptions().catch(() => ({
          universities: [],
          majors: [],
          skills: [],
        })),
      ]);

      const isOwner =
        envelope.role === "owner" ||
        envelope.project?.isOwner === true ||
        envelope.project?.id === projectId;

      if (!isOwner) {
        toast({
          variant: "destructive",
          title: "Not authorized",
          description: "Only the project owner can browse and invite students.",
        });
        navigate(ROUTES.graduationProjectWorkspace, { replace: true });
        return;
      }

      setProjectName(project.name);
      setIsTeamFull(project.isFull);
      setStudents(rows);
      setFilterOptions(filters);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load students",
        description: parseApiErrorMessage(err),
      });
      setStudents([]);
      navigate(ROUTES.graduationProjectWorkspace, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, projectId, validProjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      filterAvailableStudents(students, {
        search,
        university,
        major,
        skill,
      }),
    [students, search, university, major, skill],
  );

  const { recommended, others } = useMemo(
    () => splitStudentsByMatchScore(filtered),
    [filtered],
  );

  const hasActiveFilters = Boolean(search || university || major || skill);

  const handleInvite = async (student: ProjectAvailableStudent) => {
    if (!validProjectId || inviteDisabledReason(student, isTeamFull)) return;
    setInvitingId(student.studentId);
    try {
      await inviteStudentToProject(projectId, student.studentId);
      setStudents((prev) =>
        prev.map((s) =>
          s.studentId === student.studentId ? { ...s, hasPendingInvite: true, canInvite: false } : s,
        ),
      );
      toast({ title: "Invitation sent" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invitation failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setInvitingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setUniversity("");
    setMajor("");
    setSkill("");
  };

  if (loading) {
    return (
      <div className="student-hub flex min-h-full items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Finding students…</p>
      </div>
    );
  }

  return (
    <div className="student-hub min-h-full bg-hero">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="student-ws-page-header">
          <div>
            <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5" asChild>
              <Link to={ROUTES.graduationProjectWorkspace}>
                <ArrowLeft className="h-4 w-4" />
                Back to workspace
              </Link>
            </Button>
            <p className="student-ws-eyebrow">Team formation</p>
            <h1 className="student-ws-title">Browse students</h1>
            <p className="student-ws-description">
              Invite classmates to join{" "}
              <span className="font-medium text-foreground">
                {projectName ?? `Project #${projectId}`}
              </span>
              .
            </p>
            {isTeamFull && (
              <p className="mt-2 text-sm font-medium text-destructive">
                Team is full — no more invitations can be sent.
              </p>
            )}
          </div>
        </header>

        <div className="student-ws-surface p-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="student-ws-input pl-10"
              aria-label="Search students"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filterOptions.universities.length > 0 && (
              <div>
                <p className="student-ws-filter-label">University</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filterOptions.universities.map((u) => (
                    <StudentBrowseFilterPill
                      key={u}
                      active={university === u}
                      onClick={() => setUniversity(university === u ? "" : u)}
                    >
                      {u}
                    </StudentBrowseFilterPill>
                  ))}
                </div>
              </div>
            )}
            {filterOptions.majors.length > 0 && (
              <div>
                <p className="student-ws-filter-label">Major</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filterOptions.majors.map((m) => (
                    <StudentBrowseFilterPill
                      key={m}
                      active={major === m}
                      onClick={() => setMajor(major === m ? "" : m)}
                    >
                      {m}
                    </StudentBrowseFilterPill>
                  ))}
                </div>
              </div>
            )}
            {filterOptions.skills.length > 0 && (
              <div>
                <p className="student-ws-filter-label">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filterOptions.skills.slice(0, 24).map((s) => (
                    <StudentBrowseFilterPill
                      key={s}
                      active={skill === s}
                      onClick={() => setSkill(skill === s ? "" : s)}
                    >
                      {s}
                    </StudentBrowseFilterPill>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="student-ws-btn-outline mt-4 gap-1.5"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" aria-hidden />
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> students
            {hasActiveFilters ? " match your filters" : " available"}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Same major as you
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="student-ws-surface mt-4 flex flex-col items-center px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold text-foreground">No students found</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-10">
            <StudentSection
              title="Best matches for your project"
              count={recommended.length}
              students={recommended}
              isTeamFull={isTeamFull}
              invitingId={invitingId}
              onInvite={handleInvite}
            />
            {others.length > 0 && (
              <StudentSection
                title="Other students"
                count={others.length}
                students={others}
                isTeamFull={isTeamFull}
                invitingId={invitingId}
                onInvite={handleInvite}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
