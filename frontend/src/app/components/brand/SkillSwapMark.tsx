import { Sparkles } from "lucide-react";

import { cn } from "../ui/utils";

export type SkillSwapMarkProps = {
  className?: string;
  /** Pixel size (width & height). Defaults to 16px (h-4 w-4) in logo containers. */
  size?: number | string;
};

/**
 * SkillSwap product mark — Lucide Sparkles (AI / matching accent).
 * Uses currentColor for use on gradient backgrounds (navbar, footer, badges).
 */
export function SkillSwapMark({ className, size }: SkillSwapMarkProps) {
  if (typeof size === "number") {
    return <Sparkles className={cn("shrink-0", className)} size={size} aria-hidden />;
  }

  return <Sparkles className={cn("h-4 w-4 shrink-0", className)} aria-hidden />;
}
