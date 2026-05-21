import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Inbox, X } from "lucide-react";

import { parseApiErrorMessage } from "../../../api/axiosInstance";
import {
  acceptTeamInvitation,
  getTeamInvitations,
  rejectTeamInvitation,
  type AcceptTeamInvitationResponse,
  type TeamInvitationItem,
} from "../../../api/studentCoursesApi";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { cn } from "../../components/ui/utils";
import { CourseHubEmptyState } from "./components/courseHub/CourseHubEmptyState";
import { CourseHubPageHeader } from "./components/courseHub/CourseHubPageHeader";
import { CourseHubSubNav } from "./components/courseHub/CourseHubSubNav";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { useStudentDashboardShellProps } from "../dashboard/hooks/useStudentDashboardShellProps";

export default function StudentTeamInvitationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const shellProps = useStudentDashboardShellProps();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TeamInvitationItem[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusById, setStatusById] = useState<Record<number, "accepted" | "rejected">>({});
  const [acceptResultByInvitationId, setAcceptResultByInvitationId] = useState<
    Record<number, AcceptTeamInvitationResponse>
  >({});
  const highlightedId = useMemo(
    () =>
      Number(
        (location.state as { highlightInvitationId?: number } | null)?.highlightInvitationId ?? 0,
      ),
    [location.state],
  );
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamInvitations();
      setItems(data);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!highlightedId) return;
    const el = cardRefs.current[highlightedId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedId, items.length]);

  const handleAccept = async (id: number) => {
    setBusyId(id);
    try {
      const res = await acceptTeamInvitation(id);
      setAcceptResultByInvitationId((prev) => ({ ...prev, [id]: res }));
      setStatusById((prev) => ({ ...prev, [id]: "accepted" }));
      showToast("Invitation accepted. You joined the team.", "success");
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    setBusyId(id);
    try {
      const res = await rejectTeamInvitation(id);
      setStatusById((prev) => ({ ...prev, [id]: "rejected" }));
      showToast(res.message || "Invitation rejected.", "success");
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <StudentDashboardShell {...shellProps}>
      <CourseHubSubNav />
      <div className="max-w-3xl">
        <CourseHubPageHeader
          eyebrow="Inbox"
          title="Team invitations"
          description="Accept or reject invitations from classmates who want to team up with you."
        />

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <CourseHubEmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No pending invitations"
            description="When a classmate invites you to their team, you'll see it here."
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const busy = busyId === item.invitationId;
              const status = statusById[item.invitationId];
              const isHighlighted = highlightedId === item.invitationId;

              return (
                <Card
                  key={item.invitationId}
                  ref={(el) => {
                    cardRefs.current[item.invitationId] = el;
                  }}
                  className={cn(
                    "border-border p-6 shadow-card",
                    isHighlighted && "ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                        <AvatarFallback className="bg-primary-soft text-primary">
                          {item.senderName
                            .split(/\s+/)
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-semibold">
                            {item.senderName}
                          </h3>
                          <Badge variant="outline" className="border-border text-xs">
                            {item.senderSection}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.invitedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <Link
                          to={`/student/courses/${item.courseId}?tab=projects`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {item.courseName} · {item.projectTitle}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        {item.message ? (
                          <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">
                            {item.message}
                          </p>
                        ) : null}
                        {item.senderSkills && item.senderSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.senderSkills.map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="course-hub-chip border-0"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {status === "accepted" ? (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Badge variant="outline" className="course-hub-chip border-0">
                          Joined team
                        </Badge>
                        <Button
                          variant="gradient"
                          className="shadow-glow"
                          onClick={() => {
                            const r = acceptResultByInvitationId[item.invitationId];
                            const cid = r?.courseId ?? item.courseId;
                            const pid = r?.projectId ?? item.projectId;
                            navigate(`/student/courses/${cid}/projects/${pid}/team`);
                          }}
                        >
                          View my team
                        </Button>
                      </div>
                    ) : status === "rejected" ? (
                      <Badge variant="outline" className="border-destructive/30 text-destructive">
                        Rejected
                      </Badge>
                    ) : (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => void handleReject(item.invitationId)}
                        >
                          <X className="mr-1.5 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          variant="gradient"
                          className="shadow-glow"
                          disabled={busy}
                          onClick={() => void handleAccept(item.invitationId)}
                        >
                          <Check className="mr-1.5 h-4 w-4" />
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StudentDashboardShell>
  );
}
