import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Narrower max-width for focused forms (e.g. members). */
  narrow?: boolean;
  className?: string;
};

/** Standard page container — matches Dashboard spacing and width. */
export function CompanyPageShell({ children, narrow, className }: Props) {
  return (
    <div
      className={cn(
        "cw-page-shell cw-page-stack",
        narrow && "cw-page-shell--narrow",
        className,
      )}
    >
      {children}
    </div>
  );
}
