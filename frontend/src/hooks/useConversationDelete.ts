import { useCallback, useState } from "react";
import { deleteConversation } from "@/api/conversationsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";

export function useConversationDelete(onDeleted?: (conversationId: number) => void) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = useCallback((conversationId: number) => {
    setPendingId(conversationId);
  }, []);

  const cancelDelete = useCallback(() => {
    if (!deleting) setPendingId(null);
  }, [deleting]);

  const confirmDelete = useCallback(async () => {
    if (pendingId == null) return;
    setDeleting(true);
    try {
      await deleteConversation(pendingId);
      onDeleted?.(pendingId);
      setPendingId(null);
      toast({ title: "Conversation deleted" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete conversation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setDeleting(false);
    }
  }, [pendingId, onDeleted]);

  return {
    pendingId,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
