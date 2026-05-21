import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../ui/utils";

const skillChipVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-muted/80 text-muted-foreground",
        have: "border-accent/25 bg-accent-soft text-accent",
        need: "border-primary/20 bg-primary/10 text-primary",
        missing: "border-warning/30 bg-warning/10 text-warning",
        ai: "border-ai/20 bg-ai-soft text-ai",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type SkillChipProps = {
  label: string;
  className?: string;
} & VariantProps<typeof skillChipVariants>;

export function SkillChip({ label, variant, className }: SkillChipProps) {
  return (
    <span className={cn(skillChipVariants({ variant }), className)}>{label}</span>
  );
}

export { skillChipVariants };
