import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  ClipboardList,
  Inbox,
  Loader2,
  PlusCircle,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { DoctorHubPageHeader } from "../../../components/doctor/hub/DoctorHubPageHeader";
import { formatDistanceToNow } from "date-fns";
import type { DoctorSupervisedProject } from "../../../../api/doctorDashboardApi";
import type { DoctorMeResponse, RequestRow } from "../doctorDashboardTypes";
import { MemberAvatarStack } from "../../../components/doctor/supervision/MemberAvatarStack";
import { DoctorHubEmptyState } from "../../../components/doctor/hub/DoctorHubEmptyState";
import { SectionSpinner } from "./SectionSpinner";
import {
  buildRecentActivity,
  countActiveStudentsAcrossTeams,
} from "./doctorDashboardHelpers";
import { StatCard } from "./ui/StatCard";
import { Badge } from "../../../components/ui/badge";
import { RecentActivitySection } from "./ui/RecentActivitySection";
import {
  formatDoctorGreeting,
  formatDepartmentLine,
  formatHeroDiscipline,
} from "./doctorDisplayCopy";

/** Stats from GET /api/doctors/me/dashboard-summary */
type DoctorStats = {
  pendingRequestsCount: number;
  supervisedCount: number;
  pendingCancelCount: number;
};

type Props = {
  /** GET /api/me */
  me: DoctorMeResponse;
  doctorStats: DoctorStats | null;
  statsLoading: boolean;
  statsError: string | null;
  /** Pending rows from GET /api/doctors/me/requests + /supervisor-cancel-requests */
  pendingPreview: RequestRow[];
  pendingForActivity: RequestRow[];
  /** GET /api/doctors/me/supervised-projects */
  supervisedProjects: DoctorSupervisedProject[];
  actionKey: string | null;
  /** POST /api/supervisor-requests/{id}/accept|reject */
  onSupervisionAction: (requestId: number, action: "accept" | "reject") => void;
  onViewAllRequests: () => void;
  onViewActiveTeams: () => void;
};

function formatRequestedAt(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return formatDistanceToNow(new Date(t), { addSuffix: true });
}

function teamLine(row: Extract<RequestRow, { kind: "supervision" }>): string {
  const names = row.teamMembers.map((m) => m.name?.trim()).filter(Boolean);
  const major = row.teamMembers.find((m) => m.major?.trim())?.major?.trim() ?? "";
  const shown = names.slice(0, 3).join(", ");
  const extra = names.length > 3 ? ` +${names.length - 3}` : "";
  const dept = major || row.studentName || "";
  return dept ? `${shown}${extra} · ${dept}` : `${shown}${extra}`;
}

export function OverviewSection({
  me,
  doctorStats,
  statsLoading,
  statsError,
  pendingPreview,
  pendingForActivity,
  supervisedProjects,
  actionKey,
  onSupervisionAction,
  onViewAllRequests,
  onViewActiveTeams,
}: Props) {
  const greeting = formatDoctorGreeting(me.name);
  const heroDiscipline = formatHeroDiscipline(me.specialization, me.department, me.faculty);
  const departmentLine = formatDepartmentLine(me.specialization, me.department, me.faculty);

  const activeTeams = doctorStats?.supervisedCount ?? supervisedProjects.length;
  const pendingRequests = doctorStats?.pendingRequestsCount ?? 0;
  const cancelPending = doctorStats?.pendingCancelCount ?? 0;
  const activeStudents = countActiveStudentsAcrossTeams(supervisedProjects);
  const supervisionPreview = pendingPreview
    .filter((r): r is Extract<RequestRow, { kind: "supervision" }> => r.kind === "supervision")
    .slice(0, 3);

  const recentActivity = buildRecentActivity(pendingForActivity, supervisedProjects, []);

  if (statsLoading && !doctorStats && !statsError) {
    return <SectionSpinner label="Loading dashboard…" />;
  }

  const firstName = me.name.trim().split(/\s+/)[0] ?? "Doctor";

  return (
    <div className="space-y-6">
      <DoctorHubPageHeader
        eyebrow="Doctor workspace"
        title={`Welcome back, ${firstName}`}
        description="Manage your courses, generate balanced teams, and review supervision activity."
        actions={
          <Button asChild>
            <Link to="/courses/create">
              <PlusCircle className="h-4 w-4 mr-2" />
              New course
            </Link>
          </Button>
        }
      />

      {statsError ? (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
          {statsError}
        </div>
      ) : null}

      {pendingRequests > 0 ? (
        <Card className="mb-6 border-primary/30 bg-accent/50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">
                {pendingRequests} pending supervision request{pendingRequests === 1 ? "" : "s"}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {heroDiscipline ? departmentLine : greeting}
              </div>
            </div>
            <Button type="button" variant="outline" onClick={onViewAllRequests}>
              Review requests
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Active teams"
          value={statsLoading && doctorStats == null ? "…" : String(activeTeams)}
          to="/doctor-dashboard?section=projects"
        />
        <StatCard
          icon={Inbox}
          label="Pending requests"
          value={statsLoading && doctorStats == null ? "…" : String(pendingRequests)}
          to="/doctor-dashboard?section=requests"
        />
        <StatCard
          icon={ClipboardList}
          label="Cancel requests"
          value={statsLoading && doctorStats == null ? "…" : String(cancelPending)}
          to="/doctor-dashboard?section=requests"
        />
        <StatCard
          icon={UserCheck}
          label="Active students"
          value={
            statsLoading && supervisedProjects.length === 0 && doctorStats == null
              ? "…"
              : String(activeStudents)
          }
          hint={activeStudents > 0 ? "Across supervised teams" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground m-0">
                  Recent supervision requests
                </h2>
                <p className="text-xs text-muted-foreground mt-1 mb-0">
                  Pending requests from student teams
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={onViewAllRequests} className="shrink-0">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {supervisionPreview.length === 0 ? (
              <DoctorHubEmptyState
                icon={Inbox}
                title="No pending supervision requests"
                description="New requests from student teams will appear here."
                action={
                  <Button type="button" size="sm" onClick={onViewAllRequests}>
                    Open inbox
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {supervisionPreview.map((row) => {
                  const acceptKey = `sup-${row.requestId}-accept`;
                  const rejectKey = `sup-${row.requestId}-reject`;
                  const acceptLoading = actionKey === acceptKey;
                  const rejectLoading = actionKey === rejectKey;
                  const abstract = row.projectAbstract?.trim() ?? "";
                  const skills = row.requiredSkills.slice(0, 6);
                  const requestedLabel = formatRequestedAt(row.createdAt);
                  const teamNames = row.teamMembers.map((m) => m.name?.trim()).filter(Boolean);

                  return (
                    <div
                      key={row.requestId}
                      className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{row.projectName || "—"}</div>
                        <p className="text-xs text-muted-foreground mt-1 mb-0">{teamLine(row)}</p>
                        {teamNames.length > 0 ? (
                          <div className="mt-2">
                            <MemberAvatarStack names={teamNames} max={4} />
                          </div>
                        ) : null}
                        {abstract ? (
                          <p className="text-sm text-muted-foreground mt-2 mb-0 line-clamp-3">
                            {abstract.length > 220 ? `${abstract.slice(0, 220).trim()}…` : abstract}
                          </p>
                        ) : null}
                        {skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {skills.map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px] font-normal">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                        {requestedLabel ? (
                          <p className="text-[11px] text-muted-foreground mt-2 mb-0">
                            Requested {requestedLabel}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={actionKey != null}
                          onClick={() => onSupervisionAction(row.requestId, "accept")}
                        >
                          {acceptLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Accept
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={actionKey != null}
                          onClick={() => onSupervisionAction(row.requestId, "reject")}
                        >
                          {rejectLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={onViewAllRequests}>
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-base font-semibold text-foreground m-0">Supervised teams</h2>
                <Button type="button" variant="ghost" size="sm" onClick={onViewActiveTeams}>
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {supervisedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground m-0">No active supervisions yet.</p>
              ) : (
                <ul className="space-y-2 m-0 p-0 list-none">
                  {supervisedProjects.slice(0, 4).map((p) => (
                    <li key={p.projectId} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{p.name}</span>
                      {" · "}
                      {p.memberCount} member{p.memberCount === 1 ? "" : "s"}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <RecentActivitySection items={recentActivity} />
        </div>
      </div>
    </div>
  );
}
