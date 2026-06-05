import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import {
  FEED_SOURCE_TYPES,
  isCompanyFeedItem,
  normalizeFeedItem,
  type FeedItem,
} from "@/lib/feedTypes";
import { filterRecommendedItems, isAllowedRecommendedType } from "@/lib/feedRecommendedFilter";

export type { FeedItem } from "@/lib/feedTypes";

export type FeedRecommendedItemType = "student" | "doctor" | "company" | "association";

export type FeedRecommendedItem = {
  id: string;
  type: FeedRecommendedItemType;
  entityId: number;
  userId?: number | null;
  name: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
  matchScore: number;
  isFollowing: boolean;
  isFollowed: boolean;
  profileUrl: string | null;
  canMessage: boolean;
  canFollow: boolean;
};

export type FeedRecommendedPoolStats = {
  studentsInPool: number;
  doctorsInPool: number;
  companiesInPool: number;
  associationsInPool: number;
  companiesInDatabase: number;
  associationsInDatabase: number;
  rotationSeed: number;
  excludedCount: number;
  returnedTypes: string;
};

export type FeedRecommendedResponse = {
  items: FeedRecommendedItem[];
  poolStats: FeedRecommendedPoolStats | null;
};

export type FeedResponse = {
  items: FeedItem[];
};

export type HubSearchResultRow = {
  entityType: string;
  entityId: number;
  name: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
};

export type HubSearchResults = {
  students: HubSearchResultRow[];
  doctors: HubSearchResultRow[];
  companies: HubSearchResultRow[];
  associations: HubSearchResultRow[];
};

export const COMMUNICATION_HUB_SUGGESTIONS_REFRESH_MS = 60_000;

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[pascal] !== undefined && raw[pascal] !== null) return raw[pascal] as T;
  return undefined;
}

function normalizeFeedRecommendedItem(raw: Record<string, unknown>): FeedRecommendedItem | null {
  const typeRaw = String(readField<string>(raw, "type", "Type") ?? "").toLowerCase();
  if (!isAllowedRecommendedType(typeRaw)) return null;
  const type = typeRaw as FeedRecommendedItemType;

  const isFollowing = !!(
    readField<boolean>(raw, "isFollowing", "IsFollowing") ??
    readField<boolean>(raw, "isFollowed", "IsFollowed") ??
    false
  );

  const entityId = Number(readField<number>(raw, "entityId", "EntityId") ?? 0);
  const userId = readField<number>(raw, "userId", "UserId") ?? null;

  return {
    id: String(readField<string>(raw, "id", "Id") ?? ""),
    type,
    entityId,
    userId,
    name: String(readField<string>(raw, "name", "Name") ?? "").trim(),
    subtitle: (readField<string>(raw, "subtitle", "Subtitle") as string | null | undefined) ?? null,
    avatarUrl: (readField<string>(raw, "avatarUrl", "AvatarUrl") as string | null | undefined) ?? null,
    avatarBase64: (readField<string>(raw, "avatarBase64", "AvatarBase64") as
      | string
      | null
      | undefined) ?? null,
    matchScore: Number(readField<number>(raw, "matchScore", "MatchScore") ?? 0),
    isFollowing,
    isFollowed: isFollowing,
    profileUrl: (readField<string>(raw, "profileUrl", "ProfileUrl") as string | null | undefined) ?? null,
    canMessage: type === "student" || type === "doctor",
    canFollow: (type === "company" || type === "association") && entityId > 0,
  };
}

function mapSearchHits(value: unknown): HubSearchResultRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const raw = row as Record<string, unknown>;
      const entityType = String(readField<string>(raw, "roleType", "RoleType") ?? "").toLowerCase();
      const entityId = Number(readField<number>(raw, "id", "Id") ?? 0);
      const title = String(readField<string>(raw, "title", "Title") ?? "");
      const email = (readField<string>(raw, "email", "Email") as string | null | undefined) ?? null;
      const subtitle =
        (readField<string>(raw, "subtitle", "Subtitle") as string | null | undefined) ?? null;
      const name = title || email || "";
      return {
        entityType,
        entityId,
        name,
        subtitle,
        avatarUrl: (readField<string>(raw, "avatarUrl", "AvatarUrl") as string | null | undefined) ?? null,
        avatarBase64: (readField<string>(raw, "avatarBase64", "AvatarBase64") as
          | string
          | null
          | undefined) ?? null,
      };
    })
    .filter((row) => row.name.length > 0 && row.entityId > 0);
}

export type FeedRecommendedRequest = {
  rotation?: number;
  exclude?: string[];
};

export async function getFeedRecommended(
  opts?: FeedRecommendedRequest,
): Promise<FeedRecommendedResponse> {
  const params: Record<string, string> = {};
  if (opts?.rotation != null) params.rotation = String(opts.rotation);
  if (opts?.exclude?.length) params.exclude = opts.exclude.join(",");

  const { data } = await api.get<Record<string, unknown>>("/feed/recommended", {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  const itemsRaw = data?.items ?? data?.Items;
  const items = filterRecommendedItems(
    Array.isArray(itemsRaw)
      ? itemsRaw
          .map((row) => normalizeFeedRecommendedItem(row as Record<string, unknown>))
          .filter((item): item is FeedRecommendedItem => item != null && !!item.id && !!item.name)
      : [],
  );

  const statsRaw = (data?.poolStats ?? data?.PoolStats) as Record<string, unknown> | undefined;
  const poolStats: FeedRecommendedPoolStats | null = statsRaw
    ? {
        studentsInPool: Number(readField<number>(statsRaw, "studentsInPool", "StudentsInPool") ?? 0),
        doctorsInPool: Number(readField<number>(statsRaw, "doctorsInPool", "DoctorsInPool") ?? 0),
        companiesInPool: Number(
          readField<number>(statsRaw, "companiesInPool", "CompaniesInPool") ?? 0,
        ),
        associationsInPool: Number(
          readField<number>(statsRaw, "associationsInPool", "AssociationsInPool") ?? 0,
        ),
        companiesInDatabase: Number(
          readField<number>(statsRaw, "companiesInDatabase", "CompaniesInDatabase") ?? 0,
        ),
        associationsInDatabase: Number(
          readField<number>(statsRaw, "associationsInDatabase", "AssociationsInDatabase") ?? 0,
        ),
        rotationSeed: Number(readField<number>(statsRaw, "rotationSeed", "RotationSeed") ?? 0),
        excludedCount: Number(readField<number>(statsRaw, "excludedCount", "ExcludedCount") ?? 0),
        returnedTypes: String(readField<string>(statsRaw, "returnedTypes", "ReturnedTypes") ?? ""),
      }
    : null;

  return { items, poolStats };
}

export async function getCommunicationFeed(search?: string): Promise<FeedResponse> {
  const params = search?.trim() ? { search: search.trim() } : undefined;
  const { data } = await api.get<{ items?: Record<string, unknown>[] } & Record<string, unknown>>(
    "/feed",
    { params },
  );
  const rawItems = data?.items ?? data?.Items ?? [];
  const itemsArray = Array.isArray(rawItems) ? rawItems : [];

  const items = itemsArray
    .map((row) => normalizeFeedItem(row as Record<string, unknown>))
    .filter((item) => {
      if (isCompanyFeedItem(item)) return false;
      if (item.relatedEntityType === FEED_SOURCE_TYPES.studentCollaboration) return false;
      if (item.sourceType === "student" && item.relatedEntityType !== FEED_SOURCE_TYPES.studentPost) {
        return false;
      }
      return true;
    });

  return { items };
}

export async function searchCommunicationHub(query: string): Promise<HubSearchResults> {
  const term = query.trim();
  if (!term) {
    return { students: [], doctors: [], companies: [], associations: [] };
  }

  const { data } = await api.get<Record<string, unknown>>("/search", {
    params: { q: term, limit: 20 },
  });

  return {
    students: mapSearchHits(data?.students ?? data?.Students),
    doctors: mapSearchHits(data?.doctors ?? data?.Doctors),
    companies: mapSearchHits(data?.companies ?? data?.Companies),
    associations: mapSearchHits(data?.associations ?? data?.Associations),
  };
}

export async function followCompany(companyProfileId: number): Promise<void> {
  await api.post(`/companies/${companyProfileId}/follow`);
}

export async function unfollowCompany(companyProfileId: number): Promise<void> {
  await api.delete(`/companies/${companyProfileId}/follow`);
}

export async function followOrganization(organizationId: number): Promise<void> {
  await api.post(`/organizations/${organizationId}/follow`);
}

export async function unfollowOrganization(organizationId: number): Promise<void> {
  await api.delete(`/organizations/${organizationId}/follow`);
}

export async function fetchFollowStatus(
  sourceType: "company" | "association",
  entityId: number,
): Promise<boolean> {
  try {
    const path =
      sourceType === "company"
        ? `/companies/${entityId}/follow-status`
        : `/organizations/${entityId}/follow-status`;
    const { data } = await api.get<{ isFollowing?: boolean }>(path);
    return !!data?.isFollowing;
  } catch {
    return false;
  }
}

export { parseApiErrorMessage };
