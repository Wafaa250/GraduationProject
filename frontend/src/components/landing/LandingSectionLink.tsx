import type { MouseEvent, ReactNode } from "react";
import {
  handleLandingSectionClick,
  landingSectionHref,
  type LandingSectionId,
} from "@/lib/landingNav";

type LandingSectionLinkProps = {
  section: LandingSectionId;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
};

export function LandingSectionLink({
  section,
  className,
  children,
  onNavigate,
}: LandingSectionLinkProps) {
  const href = landingSectionHref(section);

  return (
    <a
      href={href}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) =>
        handleLandingSectionClick(event, section, onNavigate)
      }
    >
      {children}
    </a>
  );
}
