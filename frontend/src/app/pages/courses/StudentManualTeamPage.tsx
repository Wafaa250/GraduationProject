import { useEffect, useMemo, useState } from "react";
import { Mail, Send, Users } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";

import {
  getHubManualTeamStudents,
  hubTeamChoicePath,
  sendHubTeamInvitation,
} from "../../../api/studentCoursesHubApi";
import type { HubApiError, HubManualStudent } from "../../../types/studentCoursesHub";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { AvailabilityBadge } from "./components/courseHub/CourseHubBadges";
import { CourseHubEmptyState } from "./components/courseHub/CourseHubEmptyState";
import { StudentCourseSubpageShell } from "./components/StudentCourseSubpageShell";

function avatarSrc(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("data:") ? trimmed : `data:image/*;base64,${trimmed}`;
}

export default function StudentManualTeamPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const { courseId, projectId } = useParams<{ courseId?: string; projectId?: string }>();

  const safeCourseId = Number(courseId ?? 0);
  const safeProjectId = Number(projectId ?? 0);
  const backTo = hubTeamChoicePath(safeCourseId, safeProjectId);
  const navState = location.state as { projectTitle?: string } | null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState(navState?.projectTitle?.trim() || "");
  const [teamSize, setTeamSize] = useState(0);
  const [students, setStudents] = useState<HubManualStudent[]>([]);
  const [sendingToId, setSendingToId] = useState<string | null>(null);

  useEffect(() => {
    if (!safeCourseId || !safeProjectId) {
      setError("Invalid course/project route.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHubManualTeamStudents(
          String(safeCourseId),
          String(safeProjectId),
        );
        if (cancelled) return;
        setProjectTitle((prev) => prev || data.projectTitle || `Project #${safeProjectId}`);
        setTeamSize(data.teamSize);
        setStudents(data.students ?? []);
      } catch (err) {
        if (!cancelled) {
          const hubErr = err as HubApiError;
          setError(hubErr.message ?? parseApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [safeCourseId, safeProjectId]);

  const pageTitle = useMemo(
    () => projectTitle || `Project #${safeProjectId || "—"}`,
    [projectTitle, safeProjectId],
  );

  const handleSendRequest = async (studentId: string) => {
    if (!safeCourseId || !safeProjectId || sendingToId != null) return;
    setSendingToId(studentId);
    try {
      const res = await sendHubTeamInvitation(
        String(safeCourseId),
        String(safeProjectId),
        studentId,
      );
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                hasPendingRequest: true,
                availabilityStatus: "pending" as const,
              }
            : s,
        ),
      );
      showToast(res.message || "Invitation sent.", "success");
    } catch (err) {
      const hubErr = err as HubApiError;
      showToast(hubErr.message ?? parseApiErrorMessage(err), "error");
    } finally {
      setSendingToId(null);
    }
  };

  if (error) {
    return (
      <StudentCourseSubpageShell
        backTo={backTo}
        title={pageTitle}
        eyebrow="Manual team"
      >
        <CourseHubEmptyState
          icon={<Users className="h-6 w-6" />}
          title="Couldn't load classmates"
          description={error}
        />
      </StudentCourseSubpageShell>
    );
  }

  return (
    <StudentCourseSubpageShell
      backTo={backTo}
      backLabel="Back to team choice"
      eyebrow="Manual team picker"
      title={pageTitle}
      description="Browse classmates and invite the people you'd like to team up with."
      headerActions={
        !loading && teamSize > 0 ? (
          <Badge variant="outline" className="course-hub-chip border-0">
            <Users className="h-3.5 w-3.5" /> Team size: {teamSize}
          </Badge>
        ) : null
      }
    >
      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted/60" />
      ) : students.length === 0 ? (
        <CourseHubEmptyState
          icon={<Users className="h-6 w-6" />}
          title="No classmates available"
          description="You can come back later to send teammate requests."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {students.map((student) => {
            const isSending = sendingToId === student.id;
            const canInvite = student.availabilityStatus === "available";
            const src = avatarSrc(student.avatar);

            return (
              <Card
                key={student.id}
                className="flex flex-col gap-4 border-border p-5 shadow-card transition-shadow hover:shadow-elegant"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                    {src ? <AvatarImage src={src} alt={student.name} /> : null}
                    <AvatarFallback className="bg-primary-soft text-primary">
                      {student.name
                        .split(/\s+/)
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-base font-semibold">
                        {student.name}
                      </h3>
                      <Badge variant="outline" className="border-border text-xs">
                        {student.sectionName || "Section"}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      {student.email || "No email"}
                    </p>
                    {student.bio ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{student.bio}</p>
                    ) : null}
                  </div>
                </div>

                {student.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills.map((sk) => (
                      <Badge
                        key={sk}
                        variant="outline"
                        className="course-hub-chip border-0"
                      >
                        {sk}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                  <AvailabilityBadge
                    status={student.availabilityStatus}
                    reason={student.availabilityReason}
                  />
                  <Button
                    className="bg-gradient-primary shadow-glow disabled:opacity-50 disabled:shadow-none"
                    disabled={!canInvite || isSending || student.hasPendingRequest}
                    onClick={() => void handleSendRequest(student.id)}
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    {isSending
                      ? "Sending…"
                      : student.hasPendingRequest
                        ? "Request sent"
                        : canInvite
                          ? "Send invitation"
                          : "Unavailable"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </StudentCourseSubpageShell>
  );
}
