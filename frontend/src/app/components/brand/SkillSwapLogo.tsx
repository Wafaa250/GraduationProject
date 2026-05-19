import { Link } from "react-router-dom";

import { cn } from "../ui/utils";
import { SkillSwapMark } from "./SkillSwapMark";

export type SkillSwapLogoProps = {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** When false, renders a non-link group (e.g. footer). Defaults to home link. */
  link?: boolean;
  to?: string;
};

export function SkillSwapLogo({
  className,
  showWordmark = true,
  wordmarkClassName,
  link = true,
  to = "/",
}: SkillSwapLogoProps) {
  const inner = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
        <SkillSwapMark />
      </span>
      {showWordmark ? (
        <span className={cn("font-display text-lg font-bold text-foreground", wordmarkClassName)}>
          SkillSwap
        </span>
      ) : null}
    </>
  );

  if (link) {
    return (
      <Link to={to} className={cn("flex items-center gap-2", className)}>
        {inner}
      </Link>
    );
  }

  return <span className={cn("inline-flex items-center gap-2", className)}>{inner}</span>;
}
