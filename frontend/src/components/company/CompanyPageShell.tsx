import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cwLayout } from "@/lib/companyLayout";

type ShellProps = {
  children: ReactNode;
  className?: string;
};

/** Unified page container — same width, padding, and section rhythm as Dashboard. */
export function CompanyPageShell({ children, className }: ShellProps) {
  return <div className={cn(cwLayout.page, className)}>{children}</div>;
}

/** Groups related blocks with consistent vertical spacing. */
export function CompanyPageSection({ children, className }: ShellProps) {
  return <div className={cn(cwLayout.section, className)}>{children}</div>;
}
