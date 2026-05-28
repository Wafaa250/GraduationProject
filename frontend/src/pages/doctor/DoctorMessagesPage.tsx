import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getConversations,
  getConversationById,
  sendMessage,
  markConversationSeen,
  type ConversationDetails,
  type ConversationListItem,
} from "@/api/conversationsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { doctorMessageThreadPath } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import { useDoctorHubProfile } from "@/components/doctor/hub/DoctorHubProfileContext";
import {
  DoctorMessagesConversationList,
  type DoctorMessagesFilter,
} from "@/components/doctor/messages/DoctorMessagesConversationList";
import { DoctorMessagesThread } from "@/components/doctor/messages/DoctorMessagesThread";
import {
  getDoctorStudentProfilePath,
  resolveDoctorTeamWorkspacePath,
} from "@/lib/doctorMessagesNavigation";

export default function DoctorMessagesPage() {
  const { conversationId: idParam } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const profile = useDoctorHubProfile();
  const selectedId = idParam ? Number(idParam) : null;

  const [loadingList, setLoadingList] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DoctorMessagesFilter>("all");
  const [resolvingTeamLink, setResolvingTeamLink] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      setConversations(await getConversations());
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load conversations",
        description: parseApiErrorMessage(err),
      });
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(
    async (id: number) => {
      setLoadingThread(true);
      try {
        const details = await getConversationById(id);
        setThread(details);
        await markConversationSeen(id).catch(() => undefined);
        void loadList();
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
    },
    [loadList],
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId && Number.isFinite(selectedId)) {
      setThread(null);
      void loadThread(selectedId);
    } else {
      setThread(null);
    }
  }, [selectedId, loadThread]);

  const handleSelectConversation = (id: number) => {
    navigate(doctorMessageThreadPath(id));
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!selectedId || !text) return;
    setSending(true);
    try {
      await sendMessage(selectedId, text);
      setDraft("");
      await loadThread(selectedId);
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

  const handleViewTeam = async () => {
    const teamId = thread?.courseTeamId;
    if (teamId == null) return;
    setResolvingTeamLink(true);
    try {
      const path = await resolveDoctorTeamWorkspacePath(teamId);
      if (path) {
        navigate(path);
        return;
      }
      toast({
        title: "Team workspace unavailable",
        description: "Open this team from the course project workspace in Courses.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not open team",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setResolvingTeamLink(false);
    }
  };

  const handleViewStudent = () => {
    if (!thread) return;
    const path = getDoctorStudentProfilePath(thread, profile.userId);
    if (path) navigate(path);
  };

  return (
    <main className="flex min-h-full flex-1 flex-col bg-gradient-mesh">
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col px-5 py-5 lg:px-8 lg:py-6">
        <header className="mb-6 shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Communicate with supervised students and course teams.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-10 md:min-h-[calc(100vh-11rem)]">
          <DoctorMessagesConversationList
            loading={loadingList}
            conversations={conversations}
            selectedId={selectedId}
            currentUserId={profile.userId}
            query={query}
            filter={filter}
            onQueryChange={setQuery}
            onFilterChange={setFilter}
            onSelect={handleSelectConversation}
          />

          <DoctorMessagesThread
            loading={loadingThread && selectedId != null}
            thread={selectedId != null ? thread : null}
            currentUserId={profile.userId}
            draft={draft}
            sending={sending}
            resolvingTeamLink={resolvingTeamLink}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            onViewTeam={() => void handleViewTeam()}
            onViewStudent={handleViewStudent}
          />
        </div>
      </div>
    </main>
  );
}
