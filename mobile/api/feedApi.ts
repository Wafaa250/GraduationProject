import api, { parseApiErrorMessage } from "@/api/axiosInstance";
import { searchResultProfilePath } from "@/lib/feedDiscoverNavigation";
import {
  filterAndRankSearchResults,
  hasPeopleSearchResults,
  mergeSearchResults,
  searchResultDedupKey,
  SEARCH_FETCH_LIMIT,
} from "@/lib/searchRanking";
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

export type FeedDiscoverMember = {
  entityType: "student" | "doctor" | "company" | "association";
  entityId: number;
  name: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
};

export type FeedResponse = {
  items: FeedItem[];
  searchResults: FeedDiscoverMember[];
};

export type FeedSearchResultRow = {
  entityType: string;
  entityId: number;
  userId?: number;
  name: string;
  subtitle?: string | null;
  email?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
  url: string;
  followable?: boolean;
  isFollowing?: boolean;
};

export type CommunicationHubSearchResults = {
  students: FeedSearchResultRow[];
  doctors: FeedSearchResultRow[];
  companies: FeedSearchResultRow[];
  associations: FeedSearchResultRow[];
  projects: FeedSearchResultRow[];
  events: FeedSearchResultRow[];
  opportunities: FeedSearchResultRow[];
};

export type HubSearchResultRow = FeedSearchResultRow;

export type HubSearchResults = Pick<
  CommunicationHubSearchResults,
  "students" | "doctors" | "companies" | "associations"
>;

export const COMMUNICATION_HUB_SUGGESTIONS_REFRESH_MS = 60_000;

const EMPTY_SEARCH: CommunicationHubSearchResults = {
  students: [],
  doctors: [],
  companies: [],
  associations: [],
  projects: [],
  events: [],
  opportunities: [],
};

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[pascal] !== undefined && raw[pascal] !== null) return raw[pascal] as T;
  return undefined;
}

function normalizeDiscoverMember(raw: Record<string, unknown>): FeedDiscoverMember {
  const entityType = String(readField<string>(raw, "entityType", "EntityType") ?? "").toLowerCase();
  return {
    entityType: (["student", "doctor", "company", "association"].includes(entityType)
      ? entityType
      : "student") as FeedDiscoverMember["entityType"],
    entityId: Number(readField<number>(raw, "entityId", "EntityId") ?? 0),
    name: String(readField<string>(raw, "name", "Name") ?? ""),
    subtitle: (readField<string>(raw, "subtitle", "Subtitle") as string | null | undefined) ?? null,
    avatarUrl: (readField<string>(raw, "avatarUrl", "AvatarUrl") as string | null | undefined) ?? null,
    avatarBase64: (readField<string>(raw, "avatarBase64", "AvatarBase64") as
      | string
      | null
      | undefined) ?? null,
  };
}

function tagFollowableRow(row: FeedSearchResultRow): FeedSearchResultRow {
  const type = row.entityType.toLowerCase();
  if (type === "company" || type === "association") {
    const canFollow = row.followable !== false && row.entityId > 0;
    return { ...row, followable: canFollow, isFollowing: canFollow ? false : false };
  }
  return row;
}

function mapSearchHits(value: unknown): FeedSearchResultRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const raw = row as Record<string, unknown>;
      const entityType = String(readField<string>(raw, "roleType", "RoleType") ?? "").toLowerCase();
      const entityId = Number(readField<number>(raw, "id", "Id") ?? 0);
      const title = String(readField<string>(raw, "title", "Title") ?? "");
      const email = (readField<string>(raw, "email", "Email") as string | null | undefined) ?? null;
      const username =
        (readField<string>(raw, "username", "Username") as string | null | undefined) ?? null;
      const subtitle =
        (readField<string>(raw, "subtitle", "Subtitle") as string | null | undefined) ?? null;
      const name = title || email || "";
      const isCompany = entityType === "company";
      const apiUserId = Number(readField<number>(raw, "userId", "UserId") ?? 0);
      const isOrphanCompany = isCompany && entityId <= 0;
      const apiFollowable = readField<boolean>(raw, "followable", "Followable");
      const followable =
        isOrphanCompany || apiFollowable === false ? false : apiFollowable === true ? true : undefined;
      return {
        entityType,
        entityId: isOrphanCompany ? 0 : entityId,
        userId: isOrphanCompany && apiUserId > 0 ? apiUserId : undefined,
        name,
        email,
        username: isCompany ? username || subtitle : username,
        subtitle,
        avatarUrl: (readField<string>(raw, "avatarUrl", "AvatarUrl") as string | null | undefined) ?? null,
        avatarBase64: (readField<string>(raw, "avatarBase64", "AvatarBase64") as
          | string
          | null
          | undefined) ?? null,
        url: "",
        followable,
      };
    })
    .filter((row) => {
      if (!row.name.length) return false;
      if (row.entityId > 0) return true;
      return row.entityType === "company";
    })
    .map((row) => tagFollowableRow({ ...row, url: searchResultProfilePath(row) }));
}

function mapPayloadToSearchResults(payload: Record<string, unknown>): CommunicationHubSearchResults {
  return {
    students: mapSearchHits(payload.students ?? payload.Students),
    doctors: mapSearchHits(payload.doctors ?? payload.Doctors),
    companies: mapSearchHits(payload.companies ?? payload.Companies),
    associations: mapSearchHits(payload.associations ?? payload.Associations),
    projects: mapSearchHits(payload.projects ?? payload.Projects),
    events: mapSearchHits(payload.events ?? payload.Events),
    opportunities: [
      ...mapSearchHits(payload.opportunities ?? payload.Opportunities),
      ...mapSearchHits(payload.projectRequests ?? payload.ProjectRequests),
      ...mapSearchHits(payload.recruitmentCampaigns ?? payload.RecruitmentCampaigns),
    ],
  };
}

function isOrphanCompanyMember(member: FeedDiscoverMember): boolean {
  return (
    member.entityType === "company" &&
    (member.subtitle ?? "").trim().toLowerCase() === "company account"
  );
}

function feedDiscoverMemberToCompanyRow(member: FeedDiscoverMember): FeedSearchResultRow | null {
  if (!member.name.trim()) return null;
  const orphan = isOrphanCompanyMember(member);
  const base: FeedSearchResultRow = {
    entityType: "company",
    entityId: orphan ? 0 : member.entityId,
    userId: orphan && member.entityId > 0 ? member.entityId : undefined,
    name: member.name.trim(),
    subtitle: member.subtitle,
    avatarUrl: member.avatarUrl,
    avatarBase64: member.avatarBase64,
    url: "",
    followable: orphan ? false : undefined,
  };
  return tagFollowableRow({ ...base, url: searchResultProfilePath(base) });
}

function asApiRowArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["items", "Items", "data", "Data", "results", "Results"]) {
      const nested = record[key];
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

function discoverableTextMatches(term: string, fields: (string | null | undefined)[]): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return false;
  return fields.some((field) => {
    const value = field?.trim().toLowerCase();
    return !!value && value.includes(q);
  });
}

type StudentSearchRow = Record<string, unknown>;
type DoctorSearchRow = Record<string, unknown>;

function studentRowToResult(row: StudentSearchRow): FeedSearchResultRow | null {
  const userId = Number(readField<number>(row, "userId", "UserId") ?? 0);
  if (!userId) return null;
  const name =
    String(readField<string>(row, "name", "Name") ?? "").trim() ||
    String(readField<string>(row, "email", "Email") ?? "").trim();
  if (!name) return null;
  const studentId = readField<string>(row, "studentId", "StudentId");
  return {
    entityType: "student",
    entityId: userId,
    name,
    email: (readField<string>(row, "email", "Email") as string | undefined) ?? null,
    username: studentId?.trim() ? studentId.trim() : null,
    subtitle:
      String(readField<string>(row, "major", "Major") ?? "").trim() ||
      String(readField<string>(row, "university", "University") ?? "").trim() ||
      "Student",
    avatarUrl: null,
    avatarBase64:
      (readField<string>(row, "profilePicture", "ProfilePicture") as string | null | undefined) ?? null,
    url: `/students/${userId}`,
  };
}

function doctorRowToResult(row: DoctorSearchRow): FeedSearchResultRow | null {
  const userId = Number(readField<number>(row, "userId", "UserId") ?? 0);
  if (!userId) return null;
  const name =
    String(readField<string>(row, "name", "Name") ?? "").trim() ||
    String(readField<string>(row, "email", "Email") ?? "").trim();
  if (!name) return null;
  const email = (readField<string>(row, "email", "Email") as string | undefined) ?? null;
  return {
    entityType: "doctor",
    entityId: userId,
    name,
    email,
    username: email?.includes("@") ? email.split("@")[0] : null,
    subtitle:
      String(readField<string>(row, "department", "Department") ?? "").trim() ||
      String(readField<string>(row, "specialization", "Specialization") ?? "").trim() ||
      String(readField<string>(row, "faculty", "Faculty") ?? "").trim() ||
      "Doctor",
    avatarUrl: null,
    avatarBase64:
      (readField<string>(row, "profilePicture", "ProfilePicture") as string | null | undefined) ??
      (readField<string>(row, "profilePictureBase64", "ProfilePictureBase64") as
        | string
        | null
        | undefined) ??
      null,
    url: `/doctors/${userId}`,
  };
}

type ListApiPeopleLoad = {
  students: FeedSearchResultRow[];
  doctors: FeedSearchResultRow[];
  studentUserByProfile: Map<number, number>;
  doctorUserByProfile: Map<number, number>;
};

async function loadListApiStudentsAndDoctors(term: string): Promise<ListApiPeopleLoad> {
  const students: FeedSearchResultRow[] = [];
  const doctors: FeedSearchResultRow[] = [];
  const studentUserByProfile = new Map<number, number>();
  const doctorUserByProfile = new Map<number, number>();

  const [studentsRaw, doctorsRaw] = await Promise.all([
    api
      .get<StudentSearchRow[]>("/students", { params: { search: term } })
      .then((r) => r.data)
      .catch(() => [] as StudentSearchRow[]),
    api
      .get<DoctorSearchRow[]>("/doctors", { params: { search: term } })
      .then((r) => r.data)
      .catch(() => [] as DoctorSearchRow[]),
  ]);

  for (const row of Array.isArray(studentsRaw) ? studentsRaw : []) {
    const mapped = studentRowToResult(row);
    if (mapped) students.push(mapped);
    const profileId = readField<number>(row, "profileId", "ProfileId");
    const userId = readField<number>(row, "userId", "UserId");
    if (profileId != null && userId != null) {
      studentUserByProfile.set(profileId, userId);
    }
  }

  for (const row of Array.isArray(doctorsRaw) ? doctorsRaw : []) {
    const mapped = doctorRowToResult(row);
    if (mapped) doctors.push(mapped);
    const profileId = readField<number>(row, "profileId", "ProfileId");
    const userId = readField<number>(row, "userId", "UserId");
    if (profileId != null && userId != null) {
      doctorUserByProfile.set(profileId, userId);
    }
  }

  return { students, doctors, studentUserByProfile, doctorUserByProfile };
}

type PublicCompanyRow = Record<string, unknown>;
type PublicOrganizationRow = Record<string, unknown>;

function publicCompanyToResult(row: PublicCompanyRow, term: string): FeedSearchResultRow | null {
  const entityId = Number(readField<number>(row, "id", "Id") ?? 0);
  const userId = Number(readField<number>(row, "userId", "UserId") ?? 0);
  const canFollow = readField<boolean>(row, "canFollow", "CanFollow") !== false && entityId > 0;
  const name = String(readField<string>(row, "companyName", "CompanyName") ?? "").trim();
  if (!name) return null;
  const industry = String(readField<string>(row, "industry", "Industry") ?? "").trim();
  const description = String(readField<string>(row, "description", "Description") ?? "").trim();
  const areasOfInterest = String(
    readField<string>(row, "areasOfInterest", "AreasOfInterest") ?? "",
  ).trim();
  const email = (readField<string>(row, "email", "Email") as string | undefined) ?? null;

  if (entityId <= 0 && !canFollow) {
    return {
      entityType: "company",
      entityId: 0,
      userId: userId > 0 ? userId : undefined,
      name,
      email,
      username: null,
      subtitle: "Company account",
      avatarUrl: null,
      avatarBase64: null,
      url: "/feed",
      followable: false,
      isFollowing: false,
    };
  }

  if (!entityId) return null;

  if (
    !discoverableTextMatches(term, [name, industry, description, areasOfInterest, email ?? ""])
  ) {
    return null;
  }

  return {
    entityType: "company",
    entityId,
    name,
    email,
    username: industry || null,
    subtitle: description || industry || "Company",
    avatarUrl: null,
    avatarBase64: null,
    url: `/companies/${entityId}`,
    followable: true,
    isFollowing: !!readField<boolean>(row, "isFollowing", "IsFollowing"),
  };
}

function publicOrganizationToResult(row: PublicOrganizationRow, term: string): FeedSearchResultRow | null {
  const entityId = Number(readField<number>(row, "id", "Id") ?? 0);
  if (!entityId) return null;
  const name =
    String(readField<string>(row, "organizationName", "OrganizationName") ?? "").trim() ||
    String(readField<string>(row, "name", "Name") ?? "").trim();
  if (!name) return null;
  const username = readField<string>(row, "username", "Username");
  const category = String(readField<string>(row, "category", "Category") ?? "").trim();
  const faculty = String(readField<string>(row, "faculty", "Faculty") ?? "").trim();
  const shortDescription = String(
    readField<string>(row, "shortDescription", "ShortDescription") ?? "",
  ).trim();
  const subtitle =
    [faculty, category].filter(Boolean).join(" · ") || shortDescription || "Student Association";
  if (
    !discoverableTextMatches(term, [name, username ?? "", category, faculty, shortDescription])
  ) {
    return null;
  }

  return {
    entityType: "association",
    entityId,
    name,
    username: username ?? null,
    subtitle,
    avatarUrl: (readField<string>(row, "logoUrl", "LogoUrl") as string | null | undefined) ?? null,
    avatarBase64: null,
    url: `/organizations/${entityId}`,
    followable: true,
    isFollowing: !!readField<boolean>(row, "isFollowing", "IsFollowing"),
  };
}

async function loadDiscoverableCompaniesAndAssociations(
  term: string,
): Promise<Pick<CommunicationHubSearchResults, "companies" | "associations">> {
  const [companiesRes, orgsRes] = await Promise.all([
    api.get<PublicCompanyRow[]>("/companies/public", { params: { search: term } }).catch(() => null),
    api.get<PublicOrganizationRow[]>("/organizations/public").catch(() => null),
  ]);

  const companies: FeedSearchResultRow[] = [];
  for (const row of asApiRowArray<PublicCompanyRow>(companiesRes?.data)) {
    const mapped = publicCompanyToResult(row, term);
    if (mapped) companies.push(mapped);
  }

  const associations: FeedSearchResultRow[] = [];
  for (const row of asApiRowArray<PublicOrganizationRow>(orgsRes?.data)) {
    const mapped = publicOrganizationToResult(row, term);
    if (mapped) associations.push(mapped);
  }

  return { companies, associations };
}

async function loadFeedSearchCompanyRows(term: string): Promise<FeedSearchResultRow[]> {
  try {
    const feed = await getCommunicationFeed(term);
    const rows: FeedSearchResultRow[] = [];
    for (const member of feed.searchResults) {
      if (member.entityType !== "company") continue;
      const row = feedDiscoverMemberToCompanyRow(member);
      if (row) rows.push(row);
    }
    return rows;
  } catch {
    return [];
  }
}

async function enrichFollowableSearchRows(
  results: CommunicationHubSearchResults,
): Promise<CommunicationHubSearchResults> {
  const companies = await Promise.all(
    results.companies.map(async (row) => {
      if (row.followable === false || row.entityId <= 0) {
        return { ...row, followable: false, isFollowing: false };
      }
      if (row.isFollowing === true) return row;
      const isFollowing = await fetchFollowStatus("company", row.entityId);
      return { ...row, isFollowing };
    }),
  );
  const associations = await Promise.all(
    results.associations.map(async (row) => {
      if (row.isFollowing === true) return row;
      const isFollowing = await fetchFollowStatus("association", row.entityId);
      return { ...row, isFollowing };
    }),
  );
  return { ...results, companies, associations };
}

async function searchCommunicationHubFallback(
  term: string,
): Promise<CommunicationHubSearchResults> {
  const grouped: CommunicationHubSearchResults = { ...EMPTY_SEARCH };

  const [listPeople, feedResult, discoverable] = await Promise.all([
    loadListApiStudentsAndDoctors(term),
    getCommunicationFeed(term).catch(() => null),
    loadDiscoverableCompaniesAndAssociations(term),
  ]);

  grouped.students.push(...listPeople.students);
  grouped.doctors.push(...listPeople.doctors);
  const studentUserByProfile = listPeople.studentUserByProfile;
  const doctorUserByProfile = listPeople.doctorUserByProfile;

  for (const row of discoverable.companies) {
    const exists = grouped.companies.some((b) => searchResultDedupKey(b) === searchResultDedupKey(row));
    if (!exists) grouped.companies.push(row);
  }

  for (const row of discoverable.associations) {
    const exists = grouped.associations.some(
      (b) => b.entityId === row.entityId && b.entityType === row.entityType,
    );
    if (!exists) grouped.associations.push(row);
  }

  if (!feedResult) return grouped;

  for (const member of feedResult.searchResults) {
    if (!member.name?.trim()) continue;

    if (member.entityType === "company" && isOrphanCompanyMember(member)) {
      const row = feedDiscoverMemberToCompanyRow(member);
      if (!row) continue;
      const exists = grouped.companies.some(
        (b) => searchResultDedupKey(b) === searchResultDedupKey(row),
      );
      if (!exists) grouped.companies.push(row);
      continue;
    }

    if (!member.entityId) continue;

    let navId = member.entityId;
    if (member.entityType === "student") {
      const userId = studentUserByProfile.get(member.entityId);
      if (userId) navId = userId;
    } else if (member.entityType === "doctor") {
      const userId = doctorUserByProfile.get(member.entityId);
      if (userId) navId = userId;
    }

    const base: FeedSearchResultRow = {
      entityType: member.entityType,
      entityId: navId,
      name: member.name,
      subtitle: member.subtitle,
      avatarUrl: member.avatarUrl,
      avatarBase64: member.avatarBase64,
      url: "",
    };
    const row = tagFollowableRow({ ...base, url: searchResultProfilePath(base) });

    const memberKey: Record<FeedDiscoverMember["entityType"], keyof CommunicationHubSearchResults> = {
      student: "students",
      doctor: "doctors",
      company: "companies",
      association: "associations",
    };
    const bucketKey = memberKey[member.entityType];
    const bucket = grouped[bucketKey];
    const exists = bucket.some(
      (b) => b.entityId === row.entityId && b.entityType === row.entityType,
    );
    if (!exists) bucket.push(row);
  }

  return grouped;
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
  const searchResultsRaw = data?.searchResults ?? data?.SearchResults;

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

  return {
    items,
    searchResults: Array.isArray(searchResultsRaw)
      ? searchResultsRaw.map((row) => normalizeDiscoverMember(row as Record<string, unknown>))
      : [],
  };
}

export async function searchCommunicationHub(query: string): Promise<HubSearchResults> {
  const term = query.trim();
  if (!term) {
    return { students: [], doctors: [], companies: [], associations: [] };
  }

  let raw: CommunicationHubSearchResults = { ...EMPTY_SEARCH };

  const [searchPayload, discoverable, listPeople, feedCompanies] = await Promise.all([
    api
      .get<Record<string, unknown>>("/search", {
        params: { q: term, limit: SEARCH_FETCH_LIMIT },
      })
      .then((r) => r.data)
      .catch(() => null),
    loadDiscoverableCompaniesAndAssociations(term),
    loadListApiStudentsAndDoctors(term),
    loadFeedSearchCompanyRows(term),
  ]);

  if (searchPayload) {
    raw = mapPayloadToSearchResults(searchPayload);
  }

  raw = mergeSearchResults(raw, {
    ...EMPTY_SEARCH,
    students: listPeople.students,
    doctors: listPeople.doctors,
    companies: [...discoverable.companies, ...feedCompanies],
    associations: discoverable.associations,
  });

  let ranked = filterAndRankSearchResults(raw, term, { trustBackend: true });

  if (!hasPeopleSearchResults(ranked)) {
    const fallbackRaw = await searchCommunicationHubFallback(term);
    const merged = mergeSearchResults(raw, fallbackRaw);
    ranked = filterAndRankSearchResults(merged, term, { trustBackend: true });
  }

  const enriched = await enrichFollowableSearchRows(ranked);

  return {
    students: enriched.students,
    doctors: enriched.doctors,
    companies: enriched.companies,
    associations: enriched.associations,
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
