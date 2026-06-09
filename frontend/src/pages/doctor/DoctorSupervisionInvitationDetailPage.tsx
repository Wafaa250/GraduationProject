import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, GraduationCap, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  acceptSupervisionInvitation,
  getSupervisionInvitationDetail,
  rejectSupervisionInvitation,
  type SupervisionInvitationDetail,
} from "@/api/invitationDetailApi";
import {
  InvitationActionBar,
  InvitationDetailLayout,
  InvitationMetaRow,
} from "@/components/invitations/InvitationDetailLayout";
import { toast } from "@/hooks/use-toast";
import { ROUTES, doctorProjectPath } from "@/routes/paths";

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

export default function DoctorSupervisionInvitationDetailPage() {
  const { requestId: rawId } = useParams<{ requestId: string }>();
  const requestId = Number(rawId);
  const navigate = useNavigate();
  const [detail, setDetail] = useState<SupervisionInvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(requestId) || requestId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSupervisionInvitationDetail(requestId);
      setDetail(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Request unavailable",
        description: parseApiErrorMessage(err),
      });
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPending = detail?.status?.toLowerCase() === "pending";

  const handleAccept = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await acceptSupervisionInvitation(detail.requestId);
      toast({
        title: "Request accepted",
        description: "You are now supervising this graduation project.",
      });
      navigate(doctorProjectPath(detail.project.projectId), { replace: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not accept request",
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
      await rejectSupervisionInvitation(detail.requestId);
      toast({ title: "Request declined" });
      navigate(ROUTES.doctorRequests, { replace: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not decline request",
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
        title="Request unavailable"
        subtitle="This supervision request is no longer available."
        backTo={ROUTES.doctorRequests}
        backLabel="Back to requests"
      >
        <p className="text-sm text-muted-foreground">
          It may have been withdrawn, already answered, or assigned to another doctor.
        </p>
      </InvitationDetailLayout>
    );
  }

  const { project, sender } = detail;

  return (
    <InvitationDetailLayout
      title="Supervision request"
      subtitle={`${sender.name} requested you to supervise their graduation project`}
      backTo={ROUTES.doctorRequests}
      backLabel="Back to requests"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {detail.status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Submitted {formatDate(detail.createdAt)}
          </span>
        </div>

        <InvitationMetaRow
          label="Student"
          value={
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              {sender.name}
              {sender.major ? ` · ${sender.major}` : ""}
              {sender.university ? ` · ${sender.university}` : ""}
            </span>
          }
        />
        <InvitationMetaRow label="Project" value={project.name} />
        <InvitationMetaRow
          label="Description"
          value={project.description?.trim() || "No description provided."}
        />
        <InvitationMetaRow
          label="Team size"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              {project.memberCount} / {project.partnersCount} members
            </span>
          }
        />
        <InvitationMetaRow
          label="Team members"
          value={
            project.members.length === 0 ? (
              "No members listed"
            ) : (
              <ul className="space-y-1">
                {project.members.map((m) => (
                  <li key={m.studentId} className="text-sm">
                    {m.name}
                    {m.major ? (
                      <span className="text-muted-foreground"> · {m.major}</span>
                    ) : null}
                    <span className="text-muted-foreground">
                      {" "}
                      · {m.role === "leader" ? "Project lead" : "Member"}
                    </span>
                  </li>
                ))}
              </ul>
            )
          }
        />
        <InvitationMetaRow
          label="Required skills"
          value={
            project.requiredSkills.length === 0 ? (
              "None listed"
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {project.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            )
          }
        />

        {isPending ? (
          <InvitationActionBar
            busy={busy}
            acceptLabel="Accept Supervision"
            rejectLabel="Reject Request"
            onAccept={() => void handleAccept()}
            onReject={() => void handleReject()}
          />
        ) : (
          <p className="border-t border-border pt-6 text-sm text-muted-foreground">
            This request has already been {detail.status}.
          </p>
        )}
      </div>
    </InvitationDetailLayout>
  );
}
