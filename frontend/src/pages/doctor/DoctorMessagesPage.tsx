import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import {
  getConversations,
  getConversationById,
  sendMessage,
  markConversationSeen,
  type ConversationListItem,
  type ConversationDetails,
} from "@/api/conversationsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { doctorMessageThreadPath } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DoctorMessagesPage() {
  const { conversationId: idParam } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const selectedId = idParam ? Number(idParam) : null;

  const [loadingList, setLoadingList] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [thread, setThread] = useState<ConversationDetails | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

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
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (id: number) => {
    setLoadingThread(true);
    try {
      const details = await getConversationById(id);
      setThread(details);
      await markConversationSeen(id).catch(() => undefined);
      void loadList();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load conversation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoadingThread(false);
    }
  }, [loadList]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId && Number.isFinite(selectedId)) {
      void loadThread(selectedId);
    } else {
      setThread(null);
    }
  }, [selectedId, loadThread]);

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
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-5xl mx-auto">
        <DoctorHubPageHeader title="Messages" description="Team and direct conversations" />
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[480px]">
          <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No conversations yet.</p>
            ) : (
              <ul className="divide-y divide-border max-h-[520px] overflow-y-auto">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={doctorMessageThreadPath(c.id)}
                      className={cn(
                        "block px-4 py-3 hover:bg-primary/5 transition-smooth",
                        selectedId === c.id && "bg-primary/10",
                      )}
                    >
                      <div className="flex justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {c.title || `Conversation #${c.id}`}
                        </span>
                        {c.unseenCount > 0 && (
                          <span className="shrink-0 rounded-full bg-primary px-1.5 min-w-[20px] text-center text-[10px] font-bold text-primary-foreground">
                            {c.unseenCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.participantCount} participants
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white shadow-card flex flex-col min-h-[480px]">
            {!selectedId ? (
              <p className="m-auto text-sm text-muted-foreground p-8">Select a conversation</p>
            ) : loadingThread ? (
              <div className="flex justify-center items-center flex-1">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : thread ? (
              <>
                <div className="px-4 py-3 border-b border-border font-semibold text-foreground">
                  {thread.title || `Conversation #${thread.id}`}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px]">
                  {(thread.messages ?? []).map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                        m.isMine
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <input
                    className="flex-1 h-10 rounded-lg border border-border px-3 text-sm"
                    placeholder="Write a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={sending || !draft.trim()}
                    className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center disabled:opacity-50"
                    onClick={() => void handleSend()}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
        {!idParam && conversations.length > 0 && (
          <button
            type="button"
            className="sr-only"
            onClick={() => navigate(doctorMessageThreadPath(conversations[0].id))}
          />
        )}
      </div>
    </main>
  );
}
