import { ConfirmDialog } from "@/components/company/ConfirmDialog";

type ConversationDeleteConfirmProps = {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConversationDeleteConfirm({
  open,
  loading,
  onConfirm,
  onCancel,
}: ConversationDeleteConfirmProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete conversation?"
      description="This permanently removes the conversation and all messages for everyone in this chat. This cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      destructive
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
