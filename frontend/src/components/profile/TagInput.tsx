import { KeyboardEvent, useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagInputProps {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  id: string;
}

export const TagInput = ({ label, placeholder, values, onChange, id }: TagInputProps) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-background p-2 transition-smooth focus-within:border-ring focus-within:shadow-focus">
        {values.map((v) => (
          <span
            key={v}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground transition-smooth"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              aria-label={`Remove ${v}`}
              className="rounded-md text-accent-foreground/60 transition-smooth hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <div className="flex flex-1 items-center gap-1 min-w-[140px]">
          <Input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={values.length === 0 ? placeholder : "Add another..."}
            className="h-8 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={add}
            disabled={!draft.trim()}
            aria-label={`Add ${label}`}
            className="h-8 px-2 text-primary hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add</p>
    </div>
  );
};
