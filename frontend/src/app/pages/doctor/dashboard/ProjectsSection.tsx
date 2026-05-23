import { useMemo, useState } from "react";
import { ArrowRight, MessageSquare, Search, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import type { DoctorSupervisedProject } from "../../../../api/doctorDashboardApi";
import { MemberAvatarStack } from "../../../components/doctor/supervision/MemberAvatarStack";
import { DoctorHubEmptyState } from "../../../components/doctor/hub/DoctorHubEmptyState";
import { DoctorHubPageHeader } from "../../../components/doctor/hub/DoctorHubPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Progress } from "../../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { SectionSpinner } from "./SectionSpinner";

type TeamFilter = "all" | "full" | "recruiting" | "guidance";
type SortKey = "fill" | "recent";

function teamStatusLabel(p: DoctorSupervisedProject): { label: string; variant: "default" | "secondary" | "outline" } {
  if (p.isFull) return { label: "Team full", variant: "secondary" };
  if (p.memberCount === 0) return { label: "Needs guidance", variant: "outline" };
  return { label: "Recruiting", variant: "default" };
}

function teamFilterMatch(p: DoctorSupervisedProject, filter: TeamFilter): boolean {
  if (filter === "all") return true;
  if (filter === "full") return p.isFull;
  if (filter === "guidance") return p.memberCount === 0;
  return !p.isFull && p.memberCount > 0;
}

function teamFillPercent(p: DoctorSupervisedProject): number {
  if (!p.partnersCount) return 0;
  return Math.min(100, Math.round((p.memberCount / p.partnersCount) * 100));
}

function formatLastActivity(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return formatDistanceToNow(new Date(t), { addSuffix: true });
}

function memberNames(p: DoctorSupervisedProject): string[] {
  const names: string[] = [];
  if (p.owner?.name?.trim()) names.push(p.owner.name.trim());
  return names;
}

type Props = {
  projects: DoctorSupervisedProject[];
  loading: boolean;
  error: string | null;
  removingProjectId: number | null;
  onCancelSupervision: (project: DoctorSupervisedProject) => void;
  onViewRequests?: () => void;
};

export function ProjectsSection({
  projects,
  loading,
  error,
  removingProjectId,
  onCancelSupervision,
  onViewRequests,
}: Props) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [sort, setSort] = useState<SortKey>("fill");

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = projects.filter((p) => {
      if (!teamFilterMatch(p, teamFilter)) return false;
      if (!q) return true;
      const name = p.name?.toLowerCase() ?? "";
      const owner = p.owner?.name?.toLowerCase() ?? "";
      const skills = (p.requiredSkills ?? []).join(" ").toLowerCase();
      return name.includes(q) || owner.includes(q) || skills.includes(q);
    });
    if (sort === "fill") {
      rows = [...rows].sort((a, b) => teamFillPercent(b) - teamFillPercent(a));
    } else {
      rows = [...rows].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    }
    return rows;
  }, [projects, search, teamFilter, sort]);

  return (
    <div className="space-y-6">
      <DoctorHubPageHeader
        title="Active supervisions"
        description="Track every team you are currently supervising."
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            className="pl-9"
            placeholder="Search project or team member…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search supervisions"
          />
        </div>
        <Select value={teamFilter} onValueChange={(v) => setTeamFilter(v as TeamFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by team status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            <SelectItem value="full">Team full</SelectItem>
            <SelectItem value="recruiting">Recruiting</SelectItem>
            <SelectItem value="guidance">Needs guidance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Sort supervisions">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fill">Sort: Team fill</SelectItem>
            <SelectItem value="recent">Sort: Recently added</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <SectionSpinner label="Loading supervised teams…" />
      ) : list.length === 0 ? (
        <DoctorHubEmptyState
          icon={Users}
          title={projects.length === 0 ? "No supervised teams yet" : "No supervisions match"}
          description={
            projects.length === 0
              ? "Accepted supervision requests will appear here."
              : "Try clearing filters or adjusting your search."
          }
          action={
            projects.length === 0 && onViewRequests ? (
              <Button type="button" onClick={onViewRequests}>
                View requests
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {list.map((project) => {
            const removing = removingProjectId === project.projectId;
            const status = teamStatusLabel(project);
            const skills = project.requiredSkills?.length ? project.requiredSkills : [];
            const fill = teamFillPercent(project);
            const names = memberNames(project);

            return (
              <Card
                key={project.projectId}
                className={`transition-opacity ${removing ? "opacity-50 pointer-events-none" : "hover:border-primary/40"}`}
              >
                <CardContent className="p-4 md:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground leading-snug m-0">{project.name}</h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground m-0">
                    {project.memberCount} member{project.memberCount === 1 ? "" : "s"}
                    {names.length > 0 ? ` · led by ${names[0]}` : ""}
                    {" · "}
                    last updated {formatLastActivity(project.createdAt)}
                  </p>

                  {names.length > 0 ? <MemberAvatarStack names={names} max={4} /> : null}

                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 5).map((sk) => (
                        <Badge key={sk} variant="outline" className="text-[10px] font-normal">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {project.partnersCount > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Team fill</span>
                        <span className="font-semibold text-foreground tabular-nums">{fill}%</span>
                      </div>
                      <Progress value={fill} className="h-2" />
                    </div>
                  ) : null}

                  <div className="flex gap-2 pt-1">
                    <Button asChild className="flex-1">
                      <Link to={`/project/${project.projectId}`}>
                        Open workspace
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild title="Messages">
                      <Link to="/messages">
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-destructive"
                        disabled={removing}
                      >
                        {removing ? "Ending supervision…" : "End supervision"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End supervision?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will no longer supervise &ldquo;{project.name}&rdquo;. Students will be
                          notified.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onCancelSupervision(project)}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
