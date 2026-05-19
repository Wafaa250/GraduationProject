import type { CompanyTalentSearchResult } from "@/api/companyApi";
import { getItem, removeItem, setItem } from "@/utils/authStorage";

export type PersistedTalentSearchState = {
  title: string;
  description: string;
  skills: string[];
  preferredMajor: string;
  engagementType: string;
  duration: string;
  result: CompanyTalentSearchResult | null;
};

const PREFIX = "skillswap_company_talent_search";

async function storageKey(): Promise<string> {
  const userId = (await getItem("userId")) ?? "anonymous";
  return `${PREFIX}_${userId}`;
}

export async function loadTalentSearchState(): Promise<PersistedTalentSearchState | null> {
  try {
    const raw = await getItem(await storageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTalentSearchState;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      preferredMajor: parsed.preferredMajor ?? "",
      engagementType: parsed.engagementType ?? "",
      duration: parsed.duration ?? "",
      result: parsed.result ?? null,
    };
  } catch {
    return null;
  }
}

export async function saveTalentSearchState(state: PersistedTalentSearchState): Promise<void> {
  try {
    await setItem(await storageKey(), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export async function clearTalentSearchState(): Promise<void> {
  try {
    await removeItem(await storageKey());
  } catch {
    /* ignore */
  }
}

export async function getInitialTalentSearchState(): Promise<PersistedTalentSearchState> {
  return (
    (await loadTalentSearchState()) ?? {
      title: "",
      description: "",
      skills: [],
      preferredMajor: "",
      engagementType: "",
      duration: "",
      result: null,
    }
  );
}
