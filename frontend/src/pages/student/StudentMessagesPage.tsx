import { useCallback, useEffect, useState } from "react";
import { appendLiveMessage, useLiveConversationMessages } from "@/hooks/useLiveConversationMessages";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getConversationById,
  getConversations,
  markConversationSeen,
  sendMessage,
  type ConversationDetails,
  type ConversationListItem,
} from "@/api/conversationsApi";
import { getMe } from "@/api/meApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { StudentMessagesConversationList } from "@/components/student/messages/StudentMessagesConversationList";
import { StudentMessagesThread } from "@/components/student/messages/StudentMessagesThread";
import { toast } from "@/hooks/use-toast";
import { ROUTES, studentMessageThreadPath } from "@/routes/paths";
import { ConversationDeleteConfirm } from "@/components/messaging/ConversationDeleteConfirm";
import { useConversationDelete } from "@/hooks/useConversationDelete";
import "@/styles/student-hub.css";
import "@/styles/student-workspace-pages.css";

export default function StudentMessagesPage() {
  const { conversationId: idParam } = useParams<{ conversationId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedId = idParam ? Number(idParam) : null;
  const [focusComposer, setFocusComposer] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const { pendingId, deleting, requestDelete, cancelDelete, confirmDelete } =
    useConversationDelete((deletedId) => {
      setConversations((prev) => prev.filter((c) => c.id !== deletedId));
      if (selectedId === deletedId) {
        setThread(null);
        navigate(ROUTES.studentMessages);
      }
    });

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
    void getMe()
      .then((me) => setCurrentUserId(me.userId))
      .catch(() => setCurrentUserId(null));
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

  const handleLiveMessage = useCallback(
    (payload: Parameters<typeof appendLiveMessage>[1]) => {
      setThread((prev) => appendLiveMessage(prev, payload, currentUserId));
      void loadList();
    },
    [currentUserId, loadList],
  );

  useLiveConversationMessages(selectedId, handleLiveMessage);

  useEffect(() => {
    const state = location.state as { focusComposer?: boolean } | null;
    if (!state?.focusComposer) return;
    setFocusComposer(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleSelect = (id: number) => {
    navigate(studentMessageThreadPath(id));
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

  return (
    <div className="student-hub student-messages min-h-full bg-hero">
      <div className="mx-auto flex w-full max-w-[88rem] min-h-0 flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="student-messages__header">
          <h1 className="student-messages__title">Messages</h1>
          <p className="student-messages__subtitle">
            Chat with supervisors, teammates, and project groups.
          </p>
        </header>

        <div className="student-messages-shell min-h-0 flex-1">
          <StudentMessagesConversationList
            loading={loadingList}
            conversations={conversations}
            selectedId={selectedId}
            currentUserId={currentUserId}
            onSelect={handleSelect}
            onRequestDelete={requestDelete}
          />
          <StudentMessagesThread
            loading={loadingThread && selectedId != null}
            thread={selectedId != null ? thread : null}
            selectedId={selectedId}
            currentUserId={currentUserId}
            draft={draft}
            sending={sending}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            focusComposer={focusComposer}
            onComposerFocused={() => setFocusComposer(false)}
            onRequestDelete={selectedId != null ? () => requestDelete(selectedId) : undefined}
          />
        </div>
      </div>

      <ConversationDeleteConfirm
        open={pendingId != null}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
      />
    </div>
  );
}
