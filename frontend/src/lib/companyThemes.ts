export const COMPANY_THEME_IDS = [
  "copper",
  "forest",
  "champagne",
  "terracotta",
  "sage",
] as const;

export type CompanyThemeId = (typeof COMPANY_THEME_IDS)[number];

const STORAGE_KEY = "cw-theme-preference";

export function isCompanyThemeId(value: string): value is CompanyThemeId {
  return (COMPANY_THEME_IDS as readonly string[]).includes(value);
}

export function getCompanyTheme(): CompanyThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isCompanyThemeId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "copper";
}

export function setCompanyTheme(id: CompanyThemeId): void {
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new Event("cw-theme-change"));
}

export const COMPANY_THEME_META: Record<
  CompanyThemeId,
  { label: string; tagline: string; mood: string }
> = {
  copper: {
    label: "Stone + Copper",
    tagline: "Warm, credible B2B",
    mood: "Current default",
  },
  forest: {
    label: "Stone + Forest",
    tagline: "Calm, outcome-driven",
    mood: "Premium SaaS",
  },
  champagne: {
    label: "Charcoal + Champagne",
    tagline: "Executive, refined",
    mood: "Enterprise luxe",
  },
  terracotta: {
    label: "Sand + Terracotta",
    tagline: "Bold, human energy",
    mood: "Creative hiring",
  },
  sage: {
    label: "Ink + Sage",
    tagline: "Quiet, editorial",
    mood: "Long-session focus",
  },
};
