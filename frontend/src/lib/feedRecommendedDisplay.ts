import type { FeedRecommendedItem } from "@/api/feedApi";

/** Preserve API order (backend sorts by match score). Dedupe by id only. */
export function sortRecommendedForDisplay(items: FeedRecommendedItem[]): FeedRecommendedItem[] {
  const seen = new Set<string>();
  const unique: FeedRecommendedItem[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.name.localeCompare(b.name);
  });
}

export function recommendedFollowHint(type: FeedRecommendedItem["type"]): string | null {
  if (type === "company") return "Follow to see opportunities from this company";
  if (type === "association") return "Follow to stay updated on their activities";
  return null;
}
