import { getItem, setItem } from "@/utils/authStorage";

/** Poll interval for Communication Hub “Recommended For You”. */
export const FEED_RECOMMENDED_ROTATE_MS = 60_000;

/** Backend returns up to this many unified recommendations per refresh. */
export const FEED_RECOMMENDED_DISPLAY_COUNT = 4;

const ROTATION_STORAGE_KEY = "communication-hub-rec-rotation";
const LAST_IDS_STORAGE_KEY = "communication-hub-rec-last-ids";

export async function getStoredRecommendedRotationTick(): Promise<number> {
  const raw = await getItem(ROTATION_STORAGE_KEY);
  return Number(raw ?? "0") || 0;
}

/** Advances rotation seed on every API call (refresh + 60s poll). */
export async function bumpRecommendedRotationTick(current: number): Promise<number> {
  const next = current + 1;
  await setItem(ROTATION_STORAGE_KEY, String(next));
  return next;
}

export async function readLastRecommendedIds(): Promise<string[]> {
  try {
    const raw = await getItem(LAST_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export async function saveLastRecommendedIds(ids: string[]): Promise<void> {
  await setItem(LAST_IDS_STORAGE_KEY, JSON.stringify(ids));
}
