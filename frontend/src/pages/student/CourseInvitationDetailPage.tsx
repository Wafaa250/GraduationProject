import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Calendar, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  acceptCourseInvitation,
  getCourseInvitationDetail,
  rejectCourseInvitation,
  type CourseInvitationDetail,
} from "@/api/invitationDetailApi";
import {
  InvitationActionBar,
  InvitationDetailLayout,
  InvitationMetaRow,
} from "@/components/invitations/InvitationDetailLayout";
import { toast } from "@/hooks/use-toast";
import { ROUTES, studentCourseProjectPath } from "@/routes/paths";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function CourseInvitationDetailPage() {
  const { invitationId: rawId } = useParams<{ invitationId: string }>();
  const invitationId = Number(rawId);
  const navigate = useNavigate();
  const [detail, setDetail] = useState<CourseInvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(invitationId) || invitationId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCourseInvitationDetail(invitationId);
      setDetail(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invitation unavailable",
        description: parseApiErrorMessage(err),
      });
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [invitationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPending = detail?.status?.toLowerCase() === "pending";

  const handleAccept = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await acceptCourseInvitation(detail.invitationId);
      toast({
        title: "Invitation accepted",
        description: "You joined the course team.",
      });
      navigate(
        studentCourseProjectPath(detail.course.courseId, detail.project.projectId),
        { replace: true },
      );
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not accept invitation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await rejectCourseInvitation(detail.invitationId);
      toast({ title: "Invitation declined" });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not decline invitation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!detail) {
    return (
      <InvitationDetailLayout
        title="Invitation unavailable"
        subtitle="This invitation is no longer available."
        backTo={ROUTES.dashboard}
        backLabel="Back to dashboard"
      >
        <p className="text-sm text-muted-foreground">
          It may have been withdrawn, already answered, or expired.
        </p>
      </InvitationDetailLayout>
    );
  }

  return (
    <InvitationDetailLayout
      title="Course team invitation"
      subtitle={`${detail.sender.name} invited you to join their team`}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {detail.status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Invited {formatDate(detail.invitedAt)}
          </span>
        </div>

        <InvitationMetaRow
          label="Course"
          value={
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              {detail.course.courseName}
            </span>
          }
        />
        <InvitationMetaRow label="Project" value={detail.project.title} />
        <InvitationMetaRow
          label="Description"
          value={detail.project.description?.trim() || "No description provided."}
        />
        <InvitationMetaRow
          label="Invited by"
          value={`${detail.sender.name} · ${detail.sender.section}`}
        />
        <InvitationMetaRow
          label="Team capacity"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              {detail.team.memberCount} / {detail.project.teamSize} members
            </span>
          }
        />
        <InvitationMetaRow
          label="Current team members"
          value={
            detail.team.currentMembers.length === 0 ? (
              "No members yet"
            ) : (
              <ul className="space-y-1">
                {detail.team.currentMembers.map((m) => (
                  <li key={m.studentId}>{m.name}</li>
                ))}
              </ul>
            )
          }
        />

        {detail.message?.trim() ? (
          <InvitationMetaRow label="Message" value={detail.message.trim()} />
        ) : null}

        {isPending ? (
          <InvitationActionBar
            busy={busy}
            acceptLabel="Accept"
            rejectLabel="Reject"
            onAccept={() => void handleAccept()}
            onReject={() => void handleReject()}
          />
        ) : (
          <p className="border-t border-border pt-6 text-sm text-muted-foreground">
            This invitation has already been {detail.status}.
          </p>
        )}
      </div>
    </InvitationDetailLayout>
  );
}
