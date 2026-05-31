import { Sparkles } from "lucide-react";
import { cn } from "@/components/ui/utils";

type BrandLogoProps = {
  className?: string;
  /** Optional line under the wordmark (e.g. workspace label in sidebars). */
  subtitle?: string;
  subtitleClassName?: string;
};

export function LandingBrandLogo({
  className = "",
  subtitle,
  subtitleClassName,
}: BrandLogoProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <span className="font-display font-bold text-xl tracking-tight truncate">
          Skill<span className="text-gradient-primary">Swap</span>
        </span>
      </div>
      {subtitle ? (
        <p
          className={cn(
            "mt-1 ml-10 text-[11px] font-medium leading-tight text-muted-foreground truncate",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
