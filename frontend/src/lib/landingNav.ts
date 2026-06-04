import type { MouseEvent } from "react";
import { ROUTES } from "@/routes/paths";

/** In-page section anchors for the marketing landing page. */
export const LANDING_SECTIONS = {
  home: "home",
  features: "features",
  how: "how",
  roles: "roles",
  product: "product",
  why: "why",
  faq: "faq",
} as const;

export type LandingSectionId = (typeof LANDING_SECTIONS)[keyof typeof LANDING_SECTIONS];

export type RoleTabId = "students" | "doctors" | "companies" | "organizations";

const roleTabIds: RoleTabId[] = ["students", "doctors", "companies", "organizations"];

export function hashToRole(hash: string): RoleTabId | null {
  if (roleTabIds.includes(hash as RoleTabId)) return hash as RoleTabId;
  return null;
}

export function navigateToRoleTab(role: RoleTabId): void {
  scrollToLandingSection(LANDING_SECTIONS.roles, { updateHash: false });
  window.history.replaceState(null, "", `#${role}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export const landingNavLinks = [
  { label: "Home", section: LANDING_SECTIONS.home },
  { label: "Features", section: LANDING_SECTIONS.features },
  { label: "How It Works", section: LANDING_SECTIONS.how },
  { label: "Who Uses", section: LANDING_SECTIONS.roles },
  { label: "Product", section: LANDING_SECTIONS.product },
  { label: "Why SkillSwap", section: LANDING_SECTIONS.why },
] as const;

export function landingSectionHref(section: LandingSectionId): string {
  return `#${section}`;
}

export function isOnLandingPage(pathname: string): boolean {
  return pathname === ROUTES.home || pathname === "/";
}

export function scrollToLandingSection(
  section: LandingSectionId | string,
  options?: { updateHash?: boolean },
): boolean {
  const id = section.replace(/^#/, "");
  const el = document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (options?.updateHash !== false) {
    window.history.replaceState(null, "", `#${id}`);
  }
  return true;
}

export function handleLandingSectionClick(
  event: MouseEvent<HTMLAnchorElement>,
  section: LandingSectionId,
  onAfterScroll?: () => void,
): void {
  if (!isOnLandingPage(window.location.pathname)) return;

  event.preventDefault();
  scrollToLandingSection(section);
  onAfterScroll?.();
}
