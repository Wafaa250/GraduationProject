import type { ReactNode } from "react";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";

type Props = {
  children: ReactNode;
};

/** Company profile chrome without sidebar — matches owner workspace styling. */
export function CompanyPublicProfileShell({ children }: Props) {
  const { theme } = useCompanyTheme();

  return (
    <div className="company-workspace cw-shell flex w-full min-h-screen" data-cw-theme={theme}>
      <div className="cw-shell-main flex flex-col flex-1 w-full min-w-0">
        <main className="cw-shell-content pb-8">{children}</main>
      </div>
    </div>
  );
}
