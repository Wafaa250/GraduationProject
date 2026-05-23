import { Sparkles } from "lucide-react";

type BrandLogoProps = {
  className?: string;
};

export function LandingBrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
          <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <span className="font-display font-bold text-xl tracking-tight">
        Skill<span className="text-gradient-primary">Swap</span>
      </span>
    </div>
  );
}
