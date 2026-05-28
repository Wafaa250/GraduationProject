import { useRef } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type DoctorMessagesComposerProps = {
  value: string;
  sending: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function DoctorMessagesComposer({
  value,
  sending,
  disabled,
  onChange,
  onSend,
}: DoctorMessagesComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    toast({
      title: "File attachments",
      description:
        "Message file uploads are not available in the web app yet. Share links in your message text for now.",
    });
    fileInputRef.current?.click();
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={() => {
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 border-border"
          aria-label="Attach file"
          disabled={disabled || sending}
          onClick={handleAttachClick}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write a message…"
          rows={1}
          disabled={disabled || sending}
          className="min-h-[40px] max-h-32 resize-none border-border bg-secondary/40"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (value.trim() && !sending) onSend();
            }
          }}
        />
        <Button
          type="button"
          onClick={onSend}
          disabled={disabled || sending || !value.trim()}
          className="h-10 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-1.5 h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
