import { cn } from "@/lib/utils";

interface PremiumToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}

export function PremiumToggle({ checked, onChange, id }: PremiumToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-gradient-primary shadow-primary" : "bg-secondary border border-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-card shadow-elev-sm transform transition-transform duration-300",
          checked ? "translate-x-[22px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}
