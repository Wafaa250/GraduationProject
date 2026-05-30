import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Variant = "primary" | "ghost" | "outline" | "success" | "danger";

export function ActionButton({
  variant = "outline",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold px-3.5 py-2 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50";
  const variants: Record<Variant, string> = {
    primary:
      "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110 active:brightness-95",
    ghost: "text-foreground/70 hover:text-foreground hover:bg-muted",
    outline:
      "border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5",
    success: "bg-success/10 text-success border border-success/25 hover:bg-success/15",
    danger: "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15",
  };
  return (
    <button className={cn(base, variants[variant], className)} type="button" {...props}>
      {children}
    </button>
  );
}
