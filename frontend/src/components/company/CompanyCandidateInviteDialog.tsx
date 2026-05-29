import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RecommendationCandidate } from "@/types/companyRecommendation";

type Props = {
  candidate: RecommendationCandidate | null;
  open: boolean;
  sending?: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
};

export function CompanyCandidateInviteDialog({
  candidate,
  open,
  sending = false,
  onClose,
  onSend,
}: Props) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open && candidate) {
      setMessage(
        `Hi ${candidate.name.split(" ")[0]}, we'd like to invite you to collaborate on a project that aligns with your skills and interests. Happy to share more details if you're open to a quick intro.`,
      );
    }
  }, [open, candidate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !candidate) return null;

  const handleSend = () => onSend(message.trim());

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-dialog-title"
      onClick={onClose}
    >
      <div
        className="cw-card-elevated w-full max-w-md rounded-2xl p-6 shadow-xl bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="invite-dialog-title" className="text-lg font-semibold tracking-tight">
          Send invitation
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Invite <span className="font-medium text-foreground">{candidate.name}</span> to collaborate
          on this project request. Add a short note to introduce your opportunity.
        </p>

        <div className="mt-5">
          <Label htmlFor="invite-message" className="text-sm font-medium">
            Message (optional)
          </Label>
          <Textarea
            id="invite-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="rounded-xl mt-1.5"
            placeholder="Introduce your project and what you're looking for…"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-6">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl cw-btn-gradient shadow-sm border-0"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
