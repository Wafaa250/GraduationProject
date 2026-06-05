import type { FeedRecommendedItem, FeedRecommendedItemType } from "@/api/feedApi";

const ALLOWED_RECOMMENDED_TYPES = new Set<FeedRecommendedItemType>([
  "student",
  "doctor",
  "company",
  "association",
]);

const EXCLUDED_ACCOUNT_ROLE_MARKERS = new Set([
  "companymember",
  "organizationmember",
  "associationleadershipmember",
]);

export function isExcludedRecommendedAccount(item: FeedRecommendedItem): boolean {
  const subtitle = item.subtitle?.trim().toLowerCase() ?? "";
  if (subtitle === "company account") return true;

  const id = item.id.toLowerCase();
  for (const marker of EXCLUDED_ACCOUNT_ROLE_MARKERS) {
    if (id.startsWith(`${marker}-`)) return true;
  }

  if (item.type === "company" && item.entityId <= 0) return true;

  return false;
}

export function isAllowedRecommendedType(type: string): type is FeedRecommendedItemType {
  return ALLOWED_RECOMMENDED_TYPES.has(type as FeedRecommendedItemType);
}

export function filterRecommendedItems(items: FeedRecommendedItem[]): FeedRecommendedItem[] {
  return items.filter(
    (item) =>
      isAllowedRecommendedType(item.type) &&
      !isExcludedRecommendedAccount(item) &&
      item.name.trim().length > 0,
  );
}
