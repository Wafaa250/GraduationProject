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
import { getDoctorStudentProfilePath } from "@/lib/doctorMessagesNavigation";

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

  const handleViewStudent = () => {
    if (!thread) return;
    const path = getDoctorStudentProfilePath(thread, profile.userId);
    if (path) navigate(path);
  };

  return (
    <main className="doctor-messages flex min-h-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[88rem] min-h-0 flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="doctor-messages__header shrink-0">
          <h1 className="doctor-messages__title">Messages</h1>
          <p className="doctor-messages__subtitle">
            Communicate with supervised students and course teams.
          </p>
        </header>

        <div className="doctor-messages-shell min-h-0 flex-1">
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
            onConversationsRefresh={loadList}
          />

          <DoctorMessagesThread
            loading={loadingThread && selectedId != null}
            thread={selectedId != null ? thread : null}
            currentUserId={profile.userId}
            draft={draft}
            sending={sending}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            onViewStudent={handleViewStudent}
          />
        </div>
      </div>
    </main>
  );
}
