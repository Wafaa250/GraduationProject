import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { normalizeCustomEntry } from "@/constants/companyRequestCatalog";

type Props = {
  label: string;
  selected: string[];
  onChange: (skills: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  className?: string;
  hideLabel?: boolean;
};

export function MultiSelectTags({
  label,
  selected,
  onChange,
  options,
  placeholder = "Search skills…",
  className,
  hideLabel = false,
}: Props) {
  const [query, setQuery] = useState("");

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => {
      if (selected.some((s) => s.toLowerCase() === o.toLowerCase())) return false;
      if (!q) return true;
      return o.toLowerCase().includes(q);
    });
  }, [options, query, selected]);

  const customCandidate = normalizeCustomEntry(query);
  const canAddCustom =
    customCandidate &&
    !selected.some((s) => s.toLowerCase() === customCandidate.toLowerCase()) &&
    !options.some((o) => o.toLowerCase() === customCandidate.toLowerCase());

  const toggle = (skill: string) => {
    const exists = selected.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (exists) {
      onChange(selected.filter((s) => s.toLowerCase() !== skill.toLowerCase()));
    } else {
      onChange([...selected, skill]);
    }
    setQuery("");
  };

  const remove = (skill: string) => {
    onChange(selected.filter((s) => s !== skill));
  };

  const showSuggestions = available.length > 0 || canAddCustom;

  return (
    <div className={cn("space-y-2.5", className)}>
      {hideLabel ? null : <label className="cw-wizard-field-label">{label}</label>}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <Badge
              key={s}
              className="cw-request-skill-badge rounded-md pl-2.5 pr-1 py-1 gap-1 text-xs font-normal"
            >
              {s}
              <button
                type="button"
                className="rounded-sm hover:bg-primary/15 p-0.5"
                onClick={() => remove(s)}
                aria-label={`Remove ${s}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="cw-wizard-input"
        onKeyDown={(e) => {
          if (e.key === "Enter" && canAddCustom) {
            e.preventDefault();
            toggle(customCandidate!);
          }
        }}
      />

      {showSuggestions && (
        <div className="rounded-xl border bg-popover shadow-md p-2 max-h-44 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            {available.slice(0, 28).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="text-xs px-2.5 py-1 rounded-md border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {opt}
              </button>
            ))}
            {canAddCustom && (
              <button
                type="button"
                onClick={() => toggle(customCandidate!)}
                className="text-xs px-2.5 py-1 rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors w-full text-left sm:w-auto"
              >
                Create &quot;{customCandidate}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
