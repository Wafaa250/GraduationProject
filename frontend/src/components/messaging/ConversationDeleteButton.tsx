import type { MouseEvent } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ConversationDeleteButtonProps = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

export function ConversationDeleteButton({
  onClick,
  className,
}: ConversationDeleteButtonProps) {
  return (
    <button
      type="button"
      className={cn("messages-delete-btn", className)}
      onClick={onClick}
      aria-label="Delete conversation"
      title="Delete conversation"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
