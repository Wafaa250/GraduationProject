import { router, type Href } from "expo-router";

import { COMPANY_ROUTES } from "@/lib/companyRoutes";

/** Bottom-tab route names inside `(main)`. */
export const COMPANY_TAB_NAMES = {
  dashboard: "dashboard",
  requests: "requests",
  saved: "saved",
  workspace: "workspace",
  profile: "profile",
} as const;

export type CompanyTabName = keyof typeof COMPANY_TAB_NAMES;

/** Root href for each bottom tab. */
export const COMPANY_TAB_ROOT_HREFS = {
  dashboard: COMPANY_ROUTES.dashboard,
  requests: COMPANY_ROUTES.requests,
  saved: COMPANY_ROUTES.saved,
  workspace: COMPANY_ROUTES.workspace,
  profile: COMPANY_ROUTES.profile,
} as const;

/**
 * Tab-bar root navigation only.
 *
 * Uses router.navigate (never router.back() or dismissTo) so tab switches
 * stay separate from header back-button history.
 */
export function navigateToCompanyTabRoot(tabName: string): void {
  const href = COMPANY_TAB_ROOT_HREFS[tabName as CompanyTabName];
  if (!href) return;
  router.navigate(href as Href);
}
