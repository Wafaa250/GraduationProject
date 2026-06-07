import { getItem, setItem } from "@/utils/authStorage";

/** Same catalog as web `frontend/src/lib/companyThemes.ts`. */
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

export async function getCompanyTheme(): Promise<CompanyThemeId> {
  try {
    const raw = await getItem(STORAGE_KEY);
    if (raw && isCompanyThemeId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "copper";
}

export async function setCompanyTheme(id: CompanyThemeId): Promise<void> {
  await setItem(STORAGE_KEY, id);
}

export type CompanyThemeMeta = {
  label: string;
  tagline: string;
  mood: string;
};

/** Same metadata as web — extend here when new themes are added on web. */
export const COMPANY_THEME_META: Record<CompanyThemeId, CompanyThemeMeta> = {
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

export function listCompanyThemes(): { id: CompanyThemeId; meta: CompanyThemeMeta }[] {
  return COMPANY_THEME_IDS.map((id) => ({ id, meta: COMPANY_THEME_META[id] }));
}
