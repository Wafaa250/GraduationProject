import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import {
  getConversations,
  getConversationById,
  markConversationSeen,
  sendMessage,
  startConversation,
  type ConversationDetails,
} from "@/api/conversationsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { getGraduationProjectById, getGraduationProjectMembers } from "@/api/gradProjectApi";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { DoctorMessagesThread } from "@/components/doctor/messages/DoctorMessagesThread";
import { Button } from "@/components/ui/button";
import { useDoctorHubProfile } from "@/components/doctor/hub/DoctorHubProfileContext";
import { findDoctorProjectConversation } from "@/lib/doctorProjectConversation";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";

const PROJECT_OVERVIEW_BADGE = "Project overview";

export default function DoctorProjectTeamChatPage() {
  const { projectId: idParam } = useParams<{ projectId: string }>();
  const projectId = Number(idParam);
  const profile = useDoctorHubProfile();

  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [leaderUserId, setLeaderUserId] = useState<number | null>(null);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const loadThread = useCallback(async (id: number) => {
    setLoadingThread(true);
    try {
      const details = await getConversationById(id);
      setThread(details);
      await markConversationSeen(id).catch(() => undefined);
    } catch (err) {
      setThread(null);
      toast({
        variant: "destructive",
        title: "Could not load conversation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const resolveConversation = useCallback(async () => {
    if (!Number.isFinite(projectId) || !profile.userId) return;

    setLoading(true);
    setThread(null);
    setConversationId(null);

    try {
      const [project, members, conversations] = await Promise.all([
        getGraduationProjectById(projectId),
        getGraduationProjectMembers(projectId),
        getConversations(),
      ]);

      setProjectName(project.name);

      const memberUserIds = members.members.map((member) => member.userId).filter((id) => id > 0);
      const leader =
        members.members.find((member) => member.role.toLowerCase() === "leader") ??
        members.members[0];
      setLeaderUserId(leader?.userId ?? null);

      const match = findDoctorProjectConversation(
        conversations,
        project.name,
        memberUserIds,
        profile.userId,
      );

      if (match) {
        setConversationId(match.id);
        await loadThread(match.id);
        return;
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not open team chat",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [loadThread, profile.userId, projectId]);

  useEffect(() => {
    void resolveConversation();
  }, [resolveConversation]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!conversationId || !text) return;
    setSending(true);
    try {
      await sendMessage(conversationId, text);
      setDraft("");
      await loadThread(conversationId);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSending(false);
    }
  };

  const handleStartWithLeader = async () => {
    if (!leaderUserId) return;
    setStartingChat(true);
    try {
      const id = await startConversation(leaderUserId);
      setConversationId(id);
      await loadThread(id);
      toast({ title: "Conversation started", description: "You can now message the team lead." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not start conversation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setStartingChat(false);
    }
  };

  const showEmpty = useMemo(
    () => !loading && !loadingThread && conversationId == null,
    [conversationId, loading, loadingThread],
  );

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-1 flex-col bg-gradient-mesh">
      <div className="mx-auto flex w-full max-w-4xl min-h-0 flex-1 flex-col px-5 py-5 lg:px-8 lg:py-6">
        <DoctorHubPageHeader
          title="Project Team Chat"
          description={projectName ? `Group conversation for ${projectName}` : undefined}
          backTo={ROUTES.doctorProjects}
          backLabel="Active Projects"
          badge={showEmpty ? PROJECT_OVERVIEW_BADGE : undefined}
        />

        {showEmpty ? (
          <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-card">
            <MessageSquare className="h-10 w-10 text-primary/70" aria-hidden />
            <h2 className="mt-4 font-display text-lg font-semibold text-foreground">No team chat yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Start a supervision conversation with the team lead. Messages support announcements and
              shared file links.
            </p>
            {leaderUserId ? (
              <Button
                className="mt-6"
                disabled={startingChat}
                onClick={() => void handleStartWithLeader()}
              >
                {startingChat ? "Starting…" : "Message team lead"}
              </Button>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Team member information is not available yet.
              </p>
            )}
          </section>
        ) : (
          <div className="min-h-0 flex-1">
            <DoctorMessagesThread
              loading={loadingThread}
              thread={thread}
              currentUserId={profile.userId}
              draft={draft}
              sending={sending}
              headerBadge={PROJECT_OVERVIEW_BADGE}
              suppressHeaderActions
              onDraftChange={setDraft}
              onSend={() => void handleSend()}
              onViewStudent={() => undefined}
            />
          </div>
        )}
      </div>
    </main>
  );
}
