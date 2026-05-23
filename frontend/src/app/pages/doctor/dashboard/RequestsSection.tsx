import { useMemo, useState } from "react";
import { Check, ClipboardList, Loader2, MessageSquare, Search, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import type {
  SupervisorCancelRequestItem,
  SupervisorRequest,
} from "../../../../api/supervisorApi";
import type { RequestRow } from "../doctorDashboardTypes";
import { isPendingRequestStatus, supervisionRequestLabel } from "../doctorRequestUtils";
import { MemberAvatarStack } from "../../../components/doctor/supervision/MemberAvatarStack";
import { DoctorHubEmptyState } from "../../../components/doctor/hub/DoctorHubEmptyState";
import { DoctorHubPageHeader } from "../../../components/doctor/hub/DoctorHubPageHeader";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { SectionSpinner } from "./SectionSpinner";

const ABSTRACT_PREVIEW_CHARS = 320;

type StatusFilter = "all" | "pending" | "accepted" | "rejected";

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatMemberRole(role: string): string {
  const r = role?.toLowerCase();
  if (r === "leader") return "Leader";
  if (r === "member") return "Member";
  return role || "Member";
}

function buildAllRequestRows(
  supervisionRequests: SupervisorRequest[],
  cancelRequests: SupervisorCancelRequestItem[],
): RequestRow[] {
  return [
    ...supervisionRequests.map((r) => {
      const p = r.project;
      const teamMembers = (p?.members ?? []).map((m) => ({
        studentId: m.studentId,
        name: m.name ?? "",
        role: m.role ?? "member",
        major: m.major ?? "",
      }));
      return {
        kind: "supervision" as const,
        requestId: r.requestId,
        projectId: p?.projectId ?? 0,
        projectName: p?.name ?? "",
        studentName: r.sender?.name ?? "",
        status: r.status,
        projectAbstract: p?.description ?? null,
        requiredSkills: Array.isArray(p?.requiredSkills) ? p.requiredSkills : [],
        projectType: p?.projectType ?? "GP",
        partnersCount: typeof p?.partnersCount === "number" ? p.partnersCount : 0,
        memberCount: typeof p?.memberCount === "number" ? p.memberCount : teamMembers.length,
        teamMembers,
        createdAt: r.createdAt ?? "",
      };
    }),
    ...cancelRequests.map((r) => ({
      kind: "cancellation" as const,
      requestId: r.requestId,
      projectName: r.projectName,
      studentName: r.studentName,
      status: r.status,
    })),
  ].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "supervision" ? -1 : 1;
    return b.requestId - a.requestId;
  });
}

function matchesStatusFilter(status: string, filter: StatusFilter): boolean {
  const s = status?.toLowerCase() ?? "";
  if (filter === "all") return true;
  if (filter === "pending") return isPendingRequestStatus(status);
  return s === filter;
}

function formatRequestedAt(iso: string | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return formatDistanceToNow(new Date(t), { addSuffix: true });
}

type Props = {
  supervisionRequests: SupervisorRequest[];
  cancelRequests: SupervisorCancelRequestItem[];
  loading: boolean;
  error: string | null;
  actionKey: string | null;
  onSupervisionAction: (requestId: number, action: "accept" | "reject") => void;
  onCancelAction: (requestId: number, action: "accept" | "reject") => void;
};

export function RequestsSection({
  supervisionRequests,
  cancelRequests,
  loading,
  error,
  actionKey,
  onSupervisionAction,
  onCancelAction,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const allRows = useMemo(
    () => buildAllRequestRows(supervisionRequests, cancelRequests),
    [supervisionRequests, cancelRequests],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (!matchesStatusFilter(row.status, statusFilter)) return false;
      if (!q) return true;
      const projectName = row.projectName?.toLowerCase() ?? "";
      const studentName = row.studentName?.toLowerCase() ?? "";
      if (projectName.includes(q) || studentName.includes(q)) return true;
      if (row.kind === "supervision") {
        const team = row.teamMembers.map((m) => m.name?.toLowerCase()).join(" ");
        const skills = row.requiredSkills.join(" ").toLowerCase();
        return team.includes(q) || skills.includes(q);
      }
      return false;
    });
  }, [allRows, search, statusFilter]);

  const pendingCount = allRows.filter((r) => isPendingRequestStatus(r.status)).length;

  return (
    <div className="space-y-6">
      <DoctorHubPageHeader
        eyebrow="Inbox"
        title="Supervision requests"
        description="Review and respond to supervision and end-supervision requests from student teams."
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            className="pl-9"
            placeholder="Search project, student, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search requests"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" asChild className="shrink-0">
          <Link to="/messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <SectionSpinner label="Loading requests…" />
      ) : filteredRows.length === 0 ? (
        <DoctorHubEmptyState
          icon={ClipboardList}
          title={allRows.length === 0 ? "No supervision requests" : "No requests match"}
          description={
            allRows.length === 0
              ? "When students request your supervision, they will appear here."
              : "Try clearing search or changing the status filter."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => {
            const pending = isPendingRequestStatus(row.status);
            const statusLabel = row.status
              ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase()
              : "—";
            const prefix = row.kind === "supervision" ? "sup" : "can";
            const projectName = row.projectName?.trim() || "—";
            const studentName = row.studentName?.trim() || "—";
            const sup = row.kind === "supervision" ? row : null;
            const abstractPreview =
              sup?.projectAbstract?.trim()
                ? truncateText(sup.projectAbstract, ABSTRACT_PREVIEW_CHARS)
                : "";
            const teamNames =
              sup?.teamMembers?.map((m) => m.name?.trim()).filter(Boolean) ?? [];
            const acceptKey = `${prefix}-${row.requestId}-accept`;
            const rejectKey = `${prefix}-${row.requestId}-reject`;
            const acceptLoading = actionKey === acceptKey;
            const rejectLoading = actionKey === rejectKey;
            const requestedLabel = sup ? formatRequestedAt(sup.createdAt) : "";

            return (
              <Card key={`${row.kind}-${row.requestId}`} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={row.kind === "cancellation" ? "destructive" : "default"}
                          className="text-[10px]"
                        >
                          {supervisionRequestLabel(row.kind)}
                        </Badge>
                        <Badge variant={pending ? "secondary" : "outline"}>{statusLabel}</Badge>
                        {sup?.projectType ? (
                          <span className="text-xs text-muted-foreground">{sup.projectType}</span>
                        ) : null}
                        {requestedLabel ? (
                          <span className="text-xs text-muted-foreground">
                            Requested {requestedLabel}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground text-lg leading-snug m-0">
                          {projectName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-0">
                          Led by {studentName}
                        </p>
                      </div>

                      {sup && teamNames.length > 0 ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <MemberAvatarStack names={teamNames} />
                          <span className="text-xs text-muted-foreground">
                            {sup.memberCount} member{sup.memberCount === 1 ? "" : "s"}
                            {sup.partnersCount > 0 ? ` · capacity ${sup.partnersCount}` : ""}
                          </span>
                        </div>
                      ) : null}

                      {sup?.requiredSkills && sup.requiredSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {sup.requiredSkills.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] font-normal">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      {abstractPreview ? (
                        <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 mb-0">
                          &ldquo;{abstractPreview}&rdquo;
                        </p>
                      ) : null}

                      {sup && sup.teamMembers.length > 0 ? (
                        <ul className="text-xs text-muted-foreground space-y-1 m-0 pl-4 list-disc">
                          {sup.teamMembers.map((m) => (
                            <li key={`${m.studentId}-${m.role}`}>
                              <span className="font-medium text-foreground">
                                {m.name?.trim() || "—"}
                              </span>
                              {" · "}
                              {formatMemberRole(m.role)}
                              {m.major?.trim() ? ` · ${m.major.trim()}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    {pending ? (
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:min-w-[200px]">
                        <Button
                          type="button"
                          disabled={actionKey != null}
                          onClick={() =>
                            row.kind === "supervision"
                              ? onSupervisionAction(row.requestId, "accept")
                              : onCancelAction(row.requestId, "accept")
                          }
                          className="w-full"
                        >
                          {acceptLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          {row.kind === "supervision" ? "Accept supervision" : "Accept cancellation"}
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/messages">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Discuss
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={actionKey != null}
                          onClick={() =>
                            row.kind === "supervision"
                              ? onSupervisionAction(row.requestId, "reject")
                              : onCancelAction(row.requestId, "reject")
                          }
                          className="w-full"
                        >
                          {rejectLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          Decline
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
