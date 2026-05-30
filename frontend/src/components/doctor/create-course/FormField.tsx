import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  optional?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  hint,
  htmlFor,
  optional,
  icon,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground"
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
        {optional && <span className="text-muted-foreground font-normal">(optional)</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-[14px] text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring hover:border-ring/40";
