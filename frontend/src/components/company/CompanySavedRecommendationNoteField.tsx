import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { parseApiErrorMessage } from "@/api/companyApi";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null | undefined;
  placeholder?: string;
  onSave: (note: string | null) => Promise<void>;
  className?: string;
};

export function CompanySavedRecommendationNoteField({
  value,
  placeholder = "Add internal note...",
  onSave,
  className,
}: Props) {
  const [draft, setDraft] = useState(value ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(value ?? "");

  useEffect(() => {
    const next = value ?? "";
    setDraft(next);
    lastSavedRef.current = next;
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const persist = async (next: string) => {
    const normalized = next.trim();
    const payload = normalized.length > 0 ? normalized : null;
    if (payload === (lastSavedRef.current.trim() || null)) return;

    try {
      await onSave(payload);
      lastSavedRef.current = payload ?? "";
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not save note.");
    }
  };

  const scheduleSave = (next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void persist(next);
    }, 600);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void persist(draft);
  };

  return (
    <Textarea
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        scheduleSave(e.target.value);
      }}
      onBlur={handleBlur}
      placeholder={placeholder}
      rows={1}
      className={cn(
        "w-full resize-none rounded-lg border-border/40 bg-muted/25 px-3 py-2",
        "text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/70",
        "min-h-[2.25rem] max-h-24 shadow-none",
        "focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-border/60",
        className,
      )}
    />
  );
}
