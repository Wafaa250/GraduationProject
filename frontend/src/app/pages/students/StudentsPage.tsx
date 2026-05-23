import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Users, X, SlidersHorizontal } from "lucide-react";
import api from "../../../api/axiosInstance";
import { sendInvitation } from "../../../api/invitationsApi";
import { useToast } from "../../../context/ToastContext";
import { getProfileUrl } from "../../components/common/ProfileLink";
import { navigateHome } from "../../../utils/homeNavigation";
import { DoctorHubEmptyState } from "../../components/doctor/hub/DoctorHubEmptyState";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import {
  StudentDirectoryCard,
  type StudentListItem,
} from "../../components/students/StudentDirectoryCard";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Switch } from "../../components/ui/switch";
import { Alert, AlertDescription } from "../../components/ui/alert";

interface Filters {
  universities: string[];
  majors: string[];
  skills: string[];
}

function getRole(): string | null {
  try {
    return localStorage.getItem("role");
  } catch {
    return null;
  }
}

function profileHrefForStudent(userId: number, role: string | null): string {
  if (role === "doctor") return `/students/profile/${userId}`;
  return getProfileUrl({ role: "student", userId }) ?? `/students/profile/${userId}`;
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const role = getRole();
  const isDoctor = role === "doctor";

  const [searchParams] = useSearchParams();
  const projectId: number | null = searchParams.get("projectId")
    ? Number(searchParams.get("projectId"))
    : null;

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [filters, setFilters] = useState<Filters>({
    universities: [],
    majors: [],
    skills: [],
  });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [skill, setSkill] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [isTeamFull, setIsTeamFull] = useState(false);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    api
      .get(`/graduation-projects/${projectId}`)
      .then((res) => {
        const p = res.data;
        setProjectName(p.name ?? null);
        setIsTeamFull(p.isFull ?? false);
      })
      .catch(() => {});
  }, [projectId]);

  const handleInvite = async (student: StudentListItem) => {
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
    api.get("/students/filters").then((res) => setFilters(res.data)).catch(() => {});
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (university) params.set("university", university);
      if (major) params.set("major", major);
      if (skill) params.set("skill", skill);

      if (projectId) {
        const res = await api.get(
          `/graduation-projects/${projectId}/available-students?${params.toString()}`,
        );
        setStudents(
          res.data.map((s: Record<string, unknown>) => ({
            userId: s.userId as number,
            profileId: s.studentId as number,
            name: s.name as string,
            university: (s.university as string) ?? "",
            major: (s.major as string) ?? "",
            academicYear: (s.academicYear as string) ?? "",
            skills: (s.skills as string[]) ?? [],
            matchScore: (s.matchScore as number) ?? 0,
            profilePicture: (s.profilePicture as string | null) ?? null,
            isMember: Boolean(s.isMember),
            hasPendingInvite: Boolean(s.hasPendingInvite),
            canInvite: typeof s.canInvite === "boolean" ? s.canInvite : true,
            ownsGraduationProject: Boolean(s.ownsGraduationProject),
          })),
        );
      } else {
        if (availableOnly) params.set("availableOnly", "true");
        const res = await api.get(`/students?${params.toString()}`);
        const raw = Array.isArray(res.data) ? res.data : [];
        setStudents(
          raw.map((s: Record<string, unknown>) => ({
            userId: s.userId as number,
            profileId: s.profileId as number,
            name: (s.name as string) ?? "",
            university: (s.university as string) ?? "",
            major: (s.major as string) ?? "",
            academicYear: (s.academicYear as string) ?? "",
            skills: Array.isArray(s.skills) ? (s.skills as string[]) : [],
            matchScore: typeof s.matchScore === "number" ? s.matchScore : 0,
            profilePicture: (s.profilePicture as string | null) ?? null,
            isMember: Boolean(s.isMember),
            hasPendingInvite: Boolean(s.hasPendingInvite),
            canInvite: true,
            ownsGraduationProject: false,
          })),
        );
      }
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [search, university, major, skill, projectId, availableOnly]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const clearFilters = () => {
    setSearch("");
    setUniversity("");
    setMajor("");
    setSkill("");
    setAvailableOnly(false);
  };

  const hasActiveFilters = Boolean(search || university || major || skill || availableOnly);
  const activeCount = [university, major, skill, availableOnly].filter(Boolean).length;

  const sorted = useMemo(
    () => [...students].sort((a, b) => b.matchScore - a.matchScore),
    [students],
  );
  const recommended = projectId ? sorted.filter((s) => s.matchScore >= 60) : sorted;
  const others = projectId ? sorted.filter((s) => s.matchScore < 60) : [];

  const subtitle = loading
    ? "Loading…"
    : `${students.length} student${students.length !== 1 ? "s" : ""} found${
        hasActiveFilters ? " · Filters active" : ""
      }${projectId && !loading ? " · Project invite mode" : ""}`;

  const pageBody = (
    <>
      <DoctorHubPageHeader
        title={isDoctor && !projectId ? "Student Directory" : "Browse Students"}
        description={
          isDoctor && !projectId
            ? "Search students across the university. Open a profile to view skills, major, and availability."
            : "Find teammates by skills, university, and major."
        }
      />

      {projectId ? (
        <Alert className="mb-4 border-primary/20 bg-primary/5">
          <Users className="h-4 w-4" />
          <AlertDescription>
            Browsing for <strong>{projectName ?? `Project #${projectId}`}</strong> — share your
            project link so students can join.
          </AlertDescription>
        </Alert>
      ) : null}

      {projectId && isTeamFull ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Team is full — no more invitations can be sent.</AlertDescription>
        </Alert>
      ) : null}

      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasActiveFilters ? (
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              ) : null}
              <Button
                type="button"
                variant={filtersOpen ? "secondary" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setFiltersOpen((o) => !o)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeCount > 0 ? (
                  <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">
                    {activeCount}
                  </Badge>
                ) : null}
              </Button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-border">
              <FilterSelect
                label="University"
                value={university}
                onChange={setUniversity}
                options={filters.universities}
                placeholder="All universities"
              />
              <FilterSelect
                label="Major"
                value={major}
                onChange={setMajor}
                options={filters.majors}
                placeholder="All majors"
              />
              <FilterSelect
                label="Skill"
                value={skill}
                onChange={setSkill}
                options={filters.skills}
                placeholder="All skills"
              />
              {!projectId && isDoctor ? (
                <div className="flex items-end gap-2 pb-0.5">
                  <Switch
                    id="available-only"
                    checked={availableOnly}
                    onCheckedChange={setAvailableOnly}
                  />
                  <Label htmlFor="available-only" className="cursor-pointer font-normal">
                    Available only
                  </Label>
                </div>
              ) : null}
            </div>
          ) : null}

          {(university || major || skill) && (
            <div className="flex flex-wrap gap-2">
              {university ? (
                <FilterChip label={university} onRemove={() => setUniversity("")} />
              ) : null}
              {major ? <FilterChip label={major} onRemove={() => setMajor("")} /> : null}
              {skill ? <FilterChip label={skill} onRemove={() => setSkill("")} /> : null}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground -mt-2 mb-4">{subtitle}</p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <DoctorHubEmptyState
          icon={Users}
          title="No students found"
          description="Try adjusting your filters or search."
        />
      ) : projectId ? (
        <div className="space-y-8">
          <StudentSection
            title="Best matches for your project"
            count={recommended.length}
            emptyMessage="No students with a high match score yet."
          >
            {recommended.map((s) => (
              <StudentDirectoryCard
                key={s.userId}
                student={s}
                profileHref={profileHrefForStudent(s.userId, role)}
                showMatchScore
                useProfileLinkForName
                onInvite={() => handleInvite(s)}
                isTeamFull={isTeamFull}
                isSending={invitingId === s.profileId}
              />
            ))}
          </StudentSection>
          {others.length > 0 ? (
            <StudentSection title="Other students" count={others.length}>
              {others.map((s) => (
                <StudentDirectoryCard
                  key={s.userId}
                  student={s}
                  profileHref={profileHrefForStudent(s.userId, role)}
                  showMatchScore
                  useProfileLinkForName
                  onInvite={() => handleInvite(s)}
                  isTeamFull={isTeamFull}
                  isSending={invitingId === s.profileId}
                />
              ))}
            </StudentSection>
          ) : null}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((s) => (
            <StudentDirectoryCard
              key={s.userId}
              student={s}
              profileHref={profileHrefForStudent(s.userId, role)}
              showAvailableBadge={isDoctor}
            />
          ))}
        </div>
      )}
    </>
  );

  if (isDoctor && !projectId) {
    return (
      <DoctorSubpageLayout
        wide
        backTo="/doctor-dashboard"
        backLabel="Back to dashboard"
      >
        {pageBody}
      </DoctorSubpageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigateHome(navigate)}>
            Dashboard
          </Button>
          <Link
            to="/students"
            className="text-sm font-medium text-muted-foreground hover:text-foreground no-underline"
          >
            Browse students
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">{pageBody}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Select value={value || "__all__"} onValueChange={(v) => onChange(v === "__all__" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full hover:bg-muted p-0.5 leading-none"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

function StudentSection({
  title,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  emptyMessage?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground m-0">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground">{count} students</span>
      </div>
      {count === 0 && emptyMessage ? (
        <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
      )}
    </section>
  );
}
