/** Poll interval for Communication Hub “Recommended For You”. */

export const FEED_RECOMMENDED_ROTATE_MS = 60_000;



/** Backend returns up to this many unified recommendations per refresh. */

export const FEED_RECOMMENDED_DISPLAY_COUNT = 4;



const ROTATION_STORAGE_KEY = "communication-hub-rec-rotation";

const LAST_IDS_STORAGE_KEY = "communication-hub-rec-last-ids";



export function getStoredRecommendedRotationTick(): number {

  return Number(sessionStorage.getItem(ROTATION_STORAGE_KEY) ?? "0") || 0;

}



/** Advances rotation seed on every API call (refresh + 60s poll). */

export function bumpRecommendedRotationTick(current: number): number {

  const next = current + 1;

  sessionStorage.setItem(ROTATION_STORAGE_KEY, String(next));

  return next;

}



export function readLastRecommendedIds(): string[] {

  try {

    const raw = sessionStorage.getItem(LAST_IDS_STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);

  } catch {

    return [];

  }

}



export function saveLastRecommendedIds(ids: string[]): void {
  sessionStorage.setItem(LAST_IDS_STORAGE_KEY, JSON.stringify(ids));
}

