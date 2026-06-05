import { cn } from "@/lib/utils";

/** Solid brand-purple primary action button — no gradient fade. */
export const primaryActionButtonClassName = cn(
  "ss-brand-cta inline-flex items-center justify-center gap-2",
  "rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-smooth",
  "disabled:opacity-60 disabled:pointer-events-none",
);
