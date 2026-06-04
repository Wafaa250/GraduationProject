import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizeCustomEntry } from "@/constants/companyRequestCatalog";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
  hideLabel?: boolean;
  inputClassName?: string;
};

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Search…",
  allowCustom = false,
  className,
  hideLabel = false,
  inputClassName,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...options].slice(0, 80);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 80);
  }, [options, query]);

  const customCandidate = allowCustom ? normalizeCustomEntry(query) : null;
  const showCustomCreate =
    allowCustom &&
    customCandidate &&
    !options.some((o) => o.toLowerCase() === customCandidate.toLowerCase());

  const hasOptions = filtered.length > 0 || showCustomCreate;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const select = (next: string) => {
    onChange(next);
    setQuery(next);
    setOpen(false);
  };

  const optionButtonClass = (selected: boolean) =>
    cn(
      "w-full text-left px-3 py-2 hover:bg-secondary flex items-center justify-between gap-2",
      selected && "bg-primary/10 text-primary",
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {hideLabel ? null : <Label className="cw-wizard-field-label mb-0">{label}</Label>}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn("cw-wizard-input pr-9", inputClassName)}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {open && hasOptions && (
        <ul
          id={listId}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border bg-popover py-1 text-sm shadow-lg"
          role="listbox"
        >
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                className={optionButtonClass(value === opt)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(opt)}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            </li>
          ))}
          {showCustomCreate && (
            <li key={`__create__${customCandidate}`}>
              <button
                type="button"
                className={optionButtonClass(value === customCandidate)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(customCandidate!)}
              >
                <span className="truncate">Create &quot;{customCandidate}&quot;</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
