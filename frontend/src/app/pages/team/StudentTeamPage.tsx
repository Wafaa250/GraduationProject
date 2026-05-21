import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, MessageSquare, Users } from "lucide-react";

import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import { markChatScopeRead } from "../../../api/notificationsApi";
import { useToast } from "../../../context/ToastContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CourseHubBackLink } from "../courses/components/courseHub/CourseHubBackLink";
import { CourseHubEmptyState } from "../courses/components/courseHub/CourseHubEmptyState";
import { CourseHubPageHeader } from "../courses/components/courseHub/CourseHubPageHeader";
import { CourseHubTeamWorkspacePanel } from "../courses/components/courseHub/CourseHubTeamWorkspacePanel";
import {
  formatTeamDisplayName,
  getAuthUserIdFromMe,
} from "../courses/components/studentCourseHelpers";
import { StudentDashboardShell } from "../dashboard/components/StudentDashboardShell";
import { useStudentDashboardShellProps } from "../dashboard/hooks/useStudentDashboardShellProps";

type TeamMember = {
  studentId: number;
  userId: number;
  name: string;
  universityId: string;
  matchScore: number;
};

type MyTeamResponse = {
  projectId: number;
  projectTitle: string;
  courseId: number;
  teamId: number;
  teamIndex: number;
  members: TeamMember[];
};

type ChatMessage = {
  id: number;
  teamId: number;
  senderUserId: number;
  senderName: string;
  text: string;
  sentAt: string;
};

type ConversationListRow = {
  id: number;
  courseTeamId?: number | null;
  title?: string | null;
};

export default function StudentTeamPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { showToast } = useToast();
  const shellProps = useStudentDashboardShellProps();

  const [team, setTeam] = useState<MyTeamResponse | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [meData, setMeData] = useState<unknown>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [doctorConversationId, setDoctorConversationId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUserId = useMemo(() => getAuthUserIdFromMe(meData), [meData]);

  const loadTeam = useCallback(async () => {
    if (!projectId) return;
    try {
      const [teamRes, meRes] = await Promise.all([
        api.get<MyTeamResponse>(`/courses/projects/${projectId}/my-team`),
        api.get("/me"),
      ]);
      setTeam(teamRes.data);
      setMeData(meRes.data);
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setLoadingTeam(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const loadMessages = useCallback(async (teamId: number) => {
    setChatLoading(true);
    try {
      const res = await api.get<ChatMessage[]>(`/teams/${teamId}/chat?limit=100`);
      setMessages(res.data);
      await markChatScopeRead(`team:${teamId}`);
    } catch {
      /* silent */
    } finally {
      setChatLoading(false);
    }
  }, []);

  const refreshDoctorConversation = useCallback(async (teamId: number) => {
    try {
      const res = await api.get<ConversationListRow[]>("/conversations");
      const rows = Array.isArray(res.data) ? res.data : [];
      const match = rows.find((c) => c.courseTeamId === teamId);
      setDoctorConversationId(typeof match?.id === "number" && match.id > 0 ? match.id : null);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!team?.teamId) return;
    void loadMessages(team.teamId);
    void refreshDoctorConversation(team.teamId);

    pollRef.current = setInterval(() => {
      void loadMessages(team.teamId);
      void refreshDoctorConversation(team.teamId);
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [team?.teamId, loadMessages, refreshDoctorConversation]);

  const sendMessage = async (text: string) => {
    if (!team?.teamId) return;
    setChatSending(true);
    try {
      const res = await api.post<ChatMessage>(`/teams/${team.teamId}/chat`, { text });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
      throw err;
    } finally {
      setChatSending(false);
    }
  };

  if (loadingTeam) {
    return (
      <StudentDashboardShell {...shellProps}>
        <div className="h-96 animate-pulse rounded-3xl bg-muted/60" />
      </StudentDashboardShell>
    );
  }

  if (!team) {
    return (
      <StudentDashboardShell {...shellProps}>
        <CourseHubBackLink to="/student/courses">Back to courses</CourseHubBackLink>
        <CourseHubEmptyState
          icon={<Users className="h-6 w-6" />}
          title="No team assigned yet"
          description="You have not been assigned to a team for this project."
        />
      </StudentDashboardShell>
    );
  }

  const teamName = formatTeamDisplayName(team.teamIndex);
  const backHref = `/student/courses/${team.courseId}?tab=projects`;

  const doctorFooter =
    doctorConversationId != null ? (
      <div className="space-y-2">
        <div className="flex items-start gap-1.5">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[11px] font-medium leading-snug text-foreground">Doctor chat</p>
        </div>
        <Button
          size="sm"
          className="h-8 w-full rounded-full bg-gradient-primary px-3 text-xs shadow-glow hover:opacity-90"
          onClick={() =>
            navigate("/messages", {
              state: { conversationId: doctorConversationId },
            })
          }
        >
          Open
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    ) : null;

  return (
    <StudentDashboardShell {...shellProps}>
      <div>
        <CourseHubBackLink to={backHref}>Back to course</CourseHubBackLink>

        <CourseHubPageHeader
          eyebrow={teamName}
          title={team.projectTitle}
          description="Your team workspace — members, chat, and the link to your doctor when available."
          actions={
            <Badge variant="outline" className="course-hub-chip gap-1.5 border-0 px-3 py-1">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {team.members.length} {team.members.length === 1 ? "member" : "members"}
            </Badge>
          }
        />

        <CourseHubTeamWorkspacePanel
          members={team.members}
          currentUserId={currentUserId}
          messages={messages}
          chatLoading={chatLoading}
          chatSending={chatSending}
          onSend={sendMessage}
          chatPlaceholder={`Message ${teamName}…`}
          chatEmptyTitle="No team messages yet"
          chatEmptyDescription="Kick off the conversation with your team."
          footer={doctorFooter}
        />
      </div>
    </StudentDashboardShell>
  );
}
