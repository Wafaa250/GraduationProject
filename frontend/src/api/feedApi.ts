import api, { parseApiErrorMessage } from "./axiosInstance";
import { searchResultProfilePath } from "@/lib/feedDiscoverNavigation";
import {
  filterAndRankSearchResults,
  hasPeopleSearchResults,
  mergeSearchResults,
  rowMatchesQuery,
  searchResultDedupKey,
  SEARCH_FETCH_LIMIT,
} from "@/lib/searchRanking";
import { resolveFeedPostActionUrl } from "@/lib/feedActionRoutes";
import { FEED_SOURCE_TYPES, normalizeFeedItem, type FeedItem } from "@/lib/feedTypes";
import { ROUTES } from "@/routes/paths";

export type { FeedItem } from "@/lib/feedTypes";
export type FeedItemMetadata = { label: string; value: string };

export type StudentFeedSidebar = {
  name: string;
  profilePictureBase64?: string | null;
  major?: string | null;
  university?: string | null;
  academicYear?: string | null;
  skillsCount: number;
  joinedTeamsCount: number;
  completedProjectsCount: number;
  roleBadges: string[];
  profileCompletionPercent: number;
};

export type DoctorFeedSidebar = {
  name: string;
  profilePictureBase64?: string | null;
  specialization?: string | null;
  coursesCount: number;
  supervisedProjectsCount: number;
};

export type CompanyFeedSidebar = {
  companyName: string;
  industry?: string | null;
  activeOpportunitiesCount: number;
};

export type AssociationFeedSidebar = {
  associationName: string;
  logoUrl?: string | null;
  category?: string | null;
  activeAnnouncementsCount: number;
};

export type FeedSidebarSummary = {
  role: string;
  student?: StudentFeedSidebar | null;
  doctor?: DoctorFeedSidebar | null;
  company?: CompanyFeedSidebar | null;
  association?: AssociationFeedSidebar | null;
};

export type FeedSuggestedCompany = {
  companyProfileId: number;
  companyName: string;
  industry?: string | null;
  logoUrl?: string | null;
  category?: string | null;
  matchScore: number;
  isFollowing: boolean;
};

export type FeedSuggestedAssociation = {
  organizationId: number;
  name: string;
  category?: string | null;
  faculty?: string | null;
  logoUrl?: string | null;
  matchScore: number;
  isFollowing: boolean;
};

export type FeedRecommendedStudent = {
  userId: number;
  profileId: number;
  name: string;
  subtitle?: string | null;
  avatarBase64?: string | null;
  matchScore: number;
};

export type FeedRecommendedDoctor = {
  userId: number;
  profileId: number;
  name: string;
  subtitle?: string | null;
  avatarBase64?: string | null;
  matchScore: number;
};

export type FeedRecommendedForYou = {
  students: FeedRecommendedStudent[];
  doctors: FeedRecommendedDoctor[];
  companies: FeedSuggestedCompany[];
  associations: FeedSuggestedAssociation[];
};

export type FeedRecommendations = {
  students: FeedRecommendedStudent[];
  doctors: FeedRecommendedDoctor[];
  companies: FeedSuggestedCompany[];
  associations: FeedSuggestedAssociation[];
};

/** Poll interval for rotating Communication Hub recommendations (matches backend minute bucket). */
export const COMMUNICATION_HUB_SUGGESTIONS_REFRESH_MS = 60_000;

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

export type FeedSuggestions = {
  suggestedCompanies: FeedSuggestedCompany[];
  suggestedAssociations: FeedSuggestedAssociation[];
  discoverMembers: FeedDiscoverMember[];
  recommendedForYou: FeedRecommendedForYou;
};

export type FeedResponse = {
  items: FeedItem[];
  sidebar: FeedSidebarSummary;
  suggestions: FeedSuggestions;
  searchResults: FeedDiscoverMember[];
};

export type FeedSearchResultRow = {
  entityType: string;
  entityId: number;
  /** users.id for company accounts without a company_profiles row (entityId is 0). */
  userId?: number;
  name: string;
  subtitle?: string | null;
  email?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
  url: string;
  /** Company or association — show Follow/Join instead of opening a profile. */
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

function tagFollowableRow(row: FeedSearchResultRow): FeedSearchResultRow {
  const type = row.entityType.toLowerCase();
  if (type === "company" || type === "association") {
    const canFollow = row.followable !== false && row.entityId > 0;
    return { ...row, followable: canFollow, isFollowing: canFollow ? false : false };
  }
  return row;
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
  } catch (err) {
    console.warn("Feed company search failed", err);
    return [];
  }
}

async function fetchCompanyFollowStatus(companyProfileId: number): Promise<boolean> {
  try {
    const { data } = await api.get<{ isFollowing?: boolean }>(
      `/companies/${companyProfileId}/follow-status`,
    );
    return !!data?.isFollowing;
  } catch {
    return false;
  }
}

async function fetchOrganizationFollowStatus(organizationId: number): Promise<boolean> {
  try {
    const { data } = await api.get<{ isFollowing?: boolean }>(
      `/organizations/${organizationId}/follow-status`,
    );
    return !!data?.isFollowing;
  } catch {
    return false;
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
      const isFollowing = await fetchCompanyFollowStatus(row.entityId);
      return { ...row, isFollowing };
    }),
  );
  const associations = await Promise.all(
    results.associations.map(async (row) => {
      if (row.isFollowing === true) return row;
      const isFollowing = await fetchOrganizationFollowStatus(row.entityId);
      return { ...row, isFollowing };
    }),
  );
  return { ...results, companies, associations };
}

type StudentSearchRow = {
  userId?: number;
  profileId?: number;
  name?: string;
  email?: string;
  major?: string;
  university?: string;
  profilePicture?: string | null;
};

type DoctorSearchRow = {
  userId?: number;
  profileId?: number;
  name?: string;
  email?: string;
  specialization?: string;
  department?: string;
  faculty?: string;
};

function studentRowToResult(row: StudentSearchRow): FeedSearchResultRow | null {
  const r = row as Record<string, unknown>;
  const userId = Number(readField<number>(r, "userId", "UserId") ?? 0);
  if (!userId) return null;
  const name =
    String(readField<string>(r, "name", "Name") ?? "").trim() ||
    String(readField<string>(r, "email", "Email") ?? "").trim();
  if (!name) return null;
  const studentId = readField<string>(r, "studentId", "StudentId");
  return {
    entityType: "student",
    entityId: userId,
    name,
    email: (readField<string>(r, "email", "Email") as string | undefined) ?? null,
    username: studentId?.trim() ? studentId.trim() : null,
    subtitle:
      String(readField<string>(r, "major", "Major") ?? "").trim() ||
      String(readField<string>(r, "university", "University") ?? "").trim() ||
      "Student",
    avatarUrl: null,
    avatarBase64:
      (readField<string>(r, "profilePicture", "ProfilePicture") as string | null | undefined) ??
      null,
    url: ROUTES.studentDirectoryProfile(userId),
  };
}

function doctorRowToResult(row: DoctorSearchRow): FeedSearchResultRow | null {
  const r = row as Record<string, unknown>;
  const userId = Number(readField<number>(r, "userId", "UserId") ?? 0);
  if (!userId) return null;
  const name =
    String(readField<string>(r, "name", "Name") ?? "").trim() ||
    String(readField<string>(r, "email", "Email") ?? "").trim();
  if (!name) return null;
  const email = (readField<string>(r, "email", "Email") as string | undefined) ?? null;
  return {
    entityType: "doctor",
    entityId: userId,
    name,
    email,
    username: email?.includes("@") ? email.split("@")[0] : null,
    subtitle:
      String(readField<string>(r, "department", "Department") ?? "").trim() ||
      String(readField<string>(r, "specialization", "Specialization") ?? "").trim() ||
      String(readField<string>(r, "faculty", "Faculty") ?? "").trim() ||
      "Doctor",
    avatarUrl: null,
    avatarBase64:
      (readField<string>(r, "profilePicture", "ProfilePicture") as string | null | undefined) ??
      (readField<string>(r, "profilePictureBase64", "ProfilePictureBase64") as
        | string
        | null
        | undefined) ??
      null,
    url: ROUTES.doctorPublicProfile(userId),
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
    const r = row as Record<string, unknown>;
    const profileId = readField<number>(r, "profileId", "ProfileId");
    const userId = readField<number>(r, "userId", "UserId");
    if (profileId != null && userId != null) {
      studentUserByProfile.set(profileId, userId);
    }
  }

  for (const row of Array.isArray(doctorsRaw) ? doctorsRaw : []) {
    const mapped = doctorRowToResult(row);
    if (mapped) doctors.push(mapped);
    const r = row as Record<string, unknown>;
    const profileId = readField<number>(r, "profileId", "ProfileId");
    const userId = readField<number>(r, "userId", "UserId");
    if (profileId != null && userId != null) {
      doctorUserByProfile.set(profileId, userId);
    }
  }

  return { students, doctors, studentUserByProfile, doctorUserByProfile };
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

function feedItemBucket(item: FeedItem): keyof Pick<
  CommunicationHubSearchResults,
  "projects" | "events" | "opportunities"
> | null {
  const type = item.relatedEntityType;
  if (
    type === FEED_SOURCE_TYPES.doctorProject ||
    type === FEED_SOURCE_TYPES.doctorCourseProject ||
    type === FEED_SOURCE_TYPES.studentCollaboration
  ) {
    return "projects";
  }
  if (type === FEED_SOURCE_TYPES.associationEvent) return "events";
  if (
    type === FEED_SOURCE_TYPES.companyOpportunity ||
    type === FEED_SOURCE_TYPES.companyTalentRequest ||
    type === FEED_SOURCE_TYPES.associationRecruitment ||
    type === FEED_SOURCE_TYPES.associationRecruitmentPosition
  ) {
    return "opportunities";
  }
  return null;
}

function feedItemToRow(item: FeedItem): FeedSearchResultRow {
  const url = resolveFeedPostActionUrl(item);
  return {
    entityType: item.relatedEntityType,
    entityId: item.relatedEntityId,
    name: item.title,
    subtitle: item.sourceSubtitle ?? item.sourceName,
    avatarUrl: item.sourceAvatarUrl ?? null,
    avatarBase64: item.sourceImageBase64 ?? null,
    url,
  };
}

/** Primary: GET /api/search?q= (existing global search). Fallback: feed + list endpoints. */
export async function searchCommunicationHub(
  query: string,
): Promise<CommunicationHubSearchResults> {
  const term = query.trim();
  if (!term) return { ...EMPTY_SEARCH };

  let raw: CommunicationHubSearchResults = { ...EMPTY_SEARCH };

  const [searchPayload, discoverable, listPeople, feedCompanies] = await Promise.all([
    api
      .get<Record<string, unknown>>("/search", {
        params: { q: term, limit: SEARCH_FETCH_LIMIT },
      })
      .then((r) => r.data)
      .catch((err) => {
        console.warn("GET /api/search failed, using feed/list fallback", err);
        return null;
      }),
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

  return enrichFollowableSearchRows(ranked);
}

type PublicCompanyRow = {
  id?: number;
  Id?: number;
  userId?: number;
  UserId?: number;
  companyName?: string;
  CompanyName?: string;
  industry?: string;
  Industry?: string;
  description?: string;
  Description?: string;
  areasOfInterest?: string;
  AreasOfInterest?: string;
  isFollowing?: boolean;
  IsFollowing?: boolean;
  canFollow?: boolean;
  CanFollow?: boolean;
};

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

function discoverableTextMatches(
  term: string,
  fields: (string | null | undefined)[],
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return false;
  return fields.some((field) => {
    const value = field?.trim().toLowerCase();
    return !!value && value.includes(q);
  });
}

type PublicOrganizationRow = {
  id?: number;
  Id?: number;
  organizationName?: string;
  OrganizationName?: string;
  name?: string;
  Name?: string;
  username?: string;
  Username?: string;
  category?: string;
  Category?: string;
  faculty?: string;
  Faculty?: string;
  logoUrl?: string;
  LogoUrl?: string;
  shortDescription?: string;
  ShortDescription?: string;
  isFollowing?: boolean;
  IsFollowing?: boolean;
};

function publicCompanyToResult(row: PublicCompanyRow, term: string): FeedSearchResultRow | null {
  const r = row as Record<string, unknown>;
  const entityId = Number(readField<number>(r, "id", "Id") ?? 0);
  const userId = Number(readField<number>(r, "userId", "UserId") ?? 0);
  const canFollow = readField<boolean>(r, "canFollow", "CanFollow") !== false && entityId > 0;
  const name = String(readField<string>(r, "companyName", "CompanyName") ?? "").trim();
  if (!name) return null;
  const industry = String(readField<string>(r, "industry", "Industry") ?? "").trim();
  const description = String(readField<string>(r, "description", "Description") ?? "").trim();
  const areasOfInterest = String(
    readField<string>(r, "areasOfInterest", "AreasOfInterest") ?? "",
  ).trim();
  const email =
    (readField<string>(r, "email", "Email") as string | undefined) ?? null;

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
      url: ROUTES.communicationHub,
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
    url: ROUTES.companyPublicProfile(entityId),
    followable: true,
    isFollowing: !!readField<boolean>(r, "isFollowing", "IsFollowing"),
  };
}

function publicOrganizationToResult(row: PublicOrganizationRow, term: string): FeedSearchResultRow | null {
  const r = row as Record<string, unknown>;
  const entityId = Number(readField<number>(r, "id", "Id") ?? 0);
  if (!entityId) return null;
  const name =
    String(readField<string>(r, "organizationName", "OrganizationName") ?? "").trim() ||
    String(readField<string>(r, "name", "Name") ?? "").trim();
  if (!name) return null;
  const username = readField<string>(r, "username", "Username");
  const category = String(readField<string>(r, "category", "Category") ?? "").trim();
  const faculty = String(readField<string>(r, "faculty", "Faculty") ?? "").trim();
  const shortDescription = String(
    readField<string>(r, "shortDescription", "ShortDescription") ?? "",
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
    avatarUrl: (readField<string>(r, "logoUrl", "LogoUrl") as string | null | undefined) ?? null,
    avatarBase64: null,
    url: ROUTES.organizationPublicProfile(entityId),
    followable: true,
    isFollowing: !!readField<boolean>(r, "isFollowing", "IsFollowing"),
  };
}

async function loadDiscoverableCompaniesAndAssociations(
  term: string,
): Promise<Pick<CommunicationHubSearchResults, "companies" | "associations">> {
  const [companiesRes, orgsRes] = await Promise.all([
    api
      .get<PublicCompanyRow[]>("/companies/public", { params: { search: term } })
      .catch((err) => {
        console.warn("GET /companies/public failed", err);
        return null;
      }),
    api
      .get<PublicOrganizationRow[]>("/organizations/public")
      .catch((err) => {
        console.warn("GET /organizations/public failed", err);
        return null;
      }),
  ]);

  const companies: FeedSearchResultRow[] = [];
  for (const row of asApiRowArray<PublicCompanyRow>(companiesRes?.data)) {
    const mapped = publicCompanyToResult(row, term);
    if (mapped) companies.push(mapped);
  }

  const orgsRaw = asApiRowArray<PublicOrganizationRow>(orgsRes?.data);

  const associations: FeedSearchResultRow[] = [];
  for (const row of orgsRaw) {
    const mapped = publicOrganizationToResult(row, term);
    if (mapped) associations.push(mapped);
  }

  return { companies, associations };
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
      const bucket = grouped.companies;
      const exists = bucket.some((b) => searchResultDedupKey(b) === searchResultDedupKey(row));
      if (!exists) bucket.push(row);
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

  for (const item of feedResult.items) {
    const bucket = feedItemBucket(item);
    if (!bucket) continue;
    const activityRow = feedItemToRow(item);
    activityRow.url = searchResultProfilePath(activityRow);
    if (!rowMatchesQuery(activityRow, term)) continue;
    const exists = grouped[bucket].some(
      (b) => b.entityId === activityRow.entityId && b.name === activityRow.name,
    );
    if (!exists) grouped[bucket].push(activityRow);
  }

  return grouped;
}

function normalizeSuggestedCompany(raw: Record<string, unknown>): FeedSuggestedCompany {
  const id = Number(raw.companyProfileId ?? raw.CompanyProfileId ?? raw.id ?? raw.Id ?? 0);
  const name = String(
    raw.companyName ?? raw.CompanyName ?? raw.name ?? raw.Name ?? "",
  ).trim();
  const category =
    (raw.category ?? raw.Category ?? raw.industry ?? raw.Industry) as string | null | undefined;
  return {
    companyProfileId: id,
    companyName: name,
    industry: (raw.industry ?? raw.Industry) as string | null | undefined,
    logoUrl: (raw.logoUrl ?? raw.LogoUrl) as string | null | undefined,
    category: category ?? null,
    matchScore: Number(raw.matchScore ?? raw.MatchScore ?? 0),
    isFollowing: !!(raw.isFollowing ?? raw.IsFollowing),
  };
}

function normalizeSuggestedAssociation(raw: Record<string, unknown>): FeedSuggestedAssociation {
  const id = Number(raw.organizationId ?? raw.OrganizationId ?? raw.id ?? raw.Id ?? 0);
  const name = String(raw.name ?? raw.Name ?? "").trim();
  return {
    organizationId: id,
    name,
    category: (raw.category ?? raw.Category) as string | null | undefined,
    faculty: (raw.faculty ?? raw.Faculty) as string | null | undefined,
    logoUrl: (raw.logoUrl ?? raw.LogoUrl) as string | null | undefined,
    matchScore: Number(raw.matchScore ?? raw.MatchScore ?? 0),
    isFollowing: !!(raw.isFollowing ?? raw.IsFollowing),
  };
}

function normalizeRecommendedStudent(raw: Record<string, unknown>): FeedRecommendedStudent {
  return {
    userId: Number(readField<number>(raw, "userId", "UserId") ?? 0),
    profileId: Number(readField<number>(raw, "profileId", "ProfileId") ?? 0),
    name: String(readField<string>(raw, "name", "Name") ?? "").trim(),
    subtitle: (readField<string>(raw, "subtitle", "Subtitle") as string | null | undefined) ?? null,
    avatarBase64: (readField<string>(raw, "avatarBase64", "AvatarBase64") as
      | string
      | null
      | undefined) ?? null,
    matchScore: Number(readField<number>(raw, "matchScore", "MatchScore") ?? 0),
  };
}

function normalizeRecommendedDoctor(raw: Record<string, unknown>): FeedRecommendedDoctor {
  return {
    userId: Number(readField<number>(raw, "userId", "UserId") ?? 0),
    profileId: Number(readField<number>(raw, "profileId", "ProfileId") ?? 0),
    name: String(readField<string>(raw, "name", "Name") ?? "").trim(),
    subtitle: (readField<string>(raw, "subtitle", "Subtitle") as string | null | undefined) ?? null,
    avatarBase64: (readField<string>(raw, "avatarBase64", "AvatarBase64") as
      | string
      | null
      | undefined) ?? null,
    matchScore: Number(readField<number>(raw, "matchScore", "MatchScore") ?? 0),
  };
}

function normalizeRecommendedForYou(raw: unknown): FeedRecommendedForYou {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const studentsRaw = record.students ?? record.Students;
  const doctorsRaw = record.doctors ?? record.Doctors;
  const companiesRaw = record.companies ?? record.Companies;
  const associationsRaw = record.associations ?? record.Associations;

  return {
    students: Array.isArray(studentsRaw)
      ? studentsRaw.map((row) => normalizeRecommendedStudent(row as Record<string, unknown>))
      : [],
    doctors: Array.isArray(doctorsRaw)
      ? doctorsRaw.map((row) => normalizeRecommendedDoctor(row as Record<string, unknown>))
      : [],
    companies: Array.isArray(companiesRaw)
      ? companiesRaw.map((row) => normalizeSuggestedCompany(row as Record<string, unknown>))
      : [],
    associations: Array.isArray(associationsRaw)
      ? associationsRaw.map((row) => normalizeSuggestedAssociation(row as Record<string, unknown>))
      : [],
  };
}

function normalizeFeedSuggestions(raw: unknown): FeedSuggestions {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const companiesRaw = record.suggestedCompanies ?? record.SuggestedCompanies;
  const associationsRaw = record.suggestedAssociations ?? record.SuggestedAssociations;
  const discoverRaw = record.discoverMembers ?? record.DiscoverMembers;
  const recommendedRaw = record.recommendedForYou ?? record.RecommendedForYou;

  const suggestedCompanies = Array.isArray(companiesRaw)
    ? companiesRaw.map((row) => normalizeSuggestedCompany(row as Record<string, unknown>))
    : [];
  const suggestedAssociations = Array.isArray(associationsRaw)
    ? associationsRaw.map((row) => normalizeSuggestedAssociation(row as Record<string, unknown>))
    : [];

  let recommendedForYou = normalizeRecommendedForYou(recommendedRaw);
  if (
    recommendedForYou.students.length === 0 &&
    recommendedForYou.doctors.length === 0 &&
    recommendedForYou.companies.length === 0 &&
    recommendedForYou.associations.length === 0
  ) {
    recommendedForYou = {
      students: [],
      doctors: [],
      companies: suggestedCompanies.slice(0, 3),
      associations: suggestedAssociations.slice(0, 3),
    };
  }

  return {
    suggestedCompanies,
    suggestedAssociations,
    discoverMembers: Array.isArray(discoverRaw)
      ? discoverRaw.map((row) => normalizeDiscoverMember(row as Record<string, unknown>))
      : [],
    recommendedForYou,
  };
}

function recommendationsToSuggestions(rec: FeedRecommendations): Pick<
  FeedSuggestions,
  "suggestedCompanies" | "suggestedAssociations" | "recommendedForYou"
> {
  return {
    suggestedCompanies: rec.companies,
    suggestedAssociations: rec.associations,
    recommendedForYou: {
      students: rec.students,
      doctors: rec.doctors,
      companies: rec.companies,
      associations: rec.associations,
    },
  };
}

export function mergeRecommendationsIntoSuggestions(
  base: FeedSuggestions,
  rec: FeedRecommendations,
): FeedSuggestions {
  const patch = recommendationsToSuggestions(rec);
  return {
    ...base,
    ...patch,
    recommendedForYou: patch.recommendedForYou,
  };
}

export async function getFeedRecommendations(): Promise<FeedRecommendations> {
  const { data } = await api.get<Record<string, unknown>>("/feed/recommendations");
  const studentsRaw = data?.students ?? data?.Students;
  const doctorsRaw = data?.doctors ?? data?.Doctors;
  const companiesRaw = data?.companies ?? data?.Companies;
  const associationsRaw = data?.associations ?? data?.Associations;

  const students = Array.isArray(studentsRaw)
    ? studentsRaw.map((row) => normalizeRecommendedStudent(row as Record<string, unknown>))
    : [];

  const doctors = Array.isArray(doctorsRaw)
    ? doctorsRaw.map((row) => normalizeRecommendedDoctor(row as Record<string, unknown>))
    : [];

  const companies = Array.isArray(companiesRaw)
    ? companiesRaw.map((row) => {
        const normalized = normalizeSuggestedCompany(row as Record<string, unknown>);
        return {
          ...normalized,
          companyProfileId: normalized.companyProfileId || Number((row as Record<string, unknown>).id ?? 0),
          companyName: normalized.companyName || String((row as Record<string, unknown>).name ?? ""),
        };
      })
    : [];

  const associations = Array.isArray(associationsRaw)
    ? associationsRaw.map((row) => {
        const normalized = normalizeSuggestedAssociation(row as Record<string, unknown>);
        return {
          ...normalized,
          organizationId: normalized.organizationId || Number((row as Record<string, unknown>).id ?? 0),
          name: normalized.name || String((row as Record<string, unknown>).name ?? ""),
        };
      })
    : [];

  return { students, doctors, companies, associations };
}

export async function refreshCommunicationHubSuggestions(
  current: FeedSuggestions,
): Promise<FeedSuggestions> {
  const recommendations = await getFeedRecommendations();
  return mergeRecommendationsIntoSuggestions(current, recommendations);
}

export { recommendationsToSuggestions };

function normalizeFeedRecommendedItem(raw: Record<string, unknown>): FeedRecommendedItem {
  const typeRaw = String(readField<string>(raw, "type", "Type") ?? "student").toLowerCase();
  const type = (["student", "doctor", "company", "association"].includes(typeRaw)
    ? typeRaw
    : "student") as FeedRecommendedItemType;

  const isFollowing = !!(
    readField<boolean>(raw, "isFollowing", "IsFollowing") ??
    readField<boolean>(raw, "isFollowed", "IsFollowed") ??
    false
  );

  const canMessageRaw = readField<boolean>(raw, "canMessage", "CanMessage");
  const canFollowRaw = readField<boolean>(raw, "canFollow", "CanFollow");

  return {
    id: String(readField<string>(raw, "id", "Id") ?? ""),
    type,
    entityId: Number(readField<number>(raw, "entityId", "EntityId") ?? 0),
    userId: readField<number>(raw, "userId", "UserId") ?? null,
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
    canMessage:
      canMessageRaw ?? (type === "student" || type === "doctor"),
    canFollow: canFollowRaw ?? (type === "company" || type === "association"),
  };
}

export type FeedRecommendedRequest = {
  /** Client rotation counter — advances each 60s poll for fresh candidates. */
  rotation?: number;
  /** Item ids currently shown (excluded from next rotation when possible). */
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
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .map((row) => normalizeFeedRecommendedItem(row as Record<string, unknown>))
        .filter((item) => item.id && item.name)
    : [];

  const statsRaw = (data?.poolStats ?? data?.PoolStats) as Record<string, unknown> | undefined;
  const poolStats: FeedRecommendedPoolStats | null = statsRaw
    ? {
        studentsInPool: Number(readField<number>(statsRaw, "studentsInPool", "StudentsInPool") ?? 0),
        doctorsInPool: Number(readField<number>(statsRaw, "doctorsInPool", "DoctorsInPool") ?? 0),
        companiesInPool: Number(readField<number>(statsRaw, "companiesInPool", "CompaniesInPool") ?? 0),
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
  const { data } = await api.get<{ items?: Record<string, unknown>[] } & Record<string, unknown>>("/feed", {
    params,
  });
  const rawItems = data?.items ?? data?.Items ?? [];
  const itemsArray = Array.isArray(rawItems) ? rawItems : [];

  const suggestions = normalizeFeedSuggestions(data?.suggestions ?? data?.Suggestions);

  const searchResultsRaw = data?.searchResults ?? data?.SearchResults;

  return {
    items: itemsArray.map((row) => normalizeFeedItem(row as Record<string, unknown>)),
    sidebar: (data?.sidebar ?? data?.Sidebar ?? { role: "student" }) as FeedSidebarSummary,
    suggestions,
    searchResults: Array.isArray(searchResultsRaw)
      ? searchResultsRaw.map((row) => normalizeDiscoverMember(row as Record<string, unknown>))
      : [],
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

export { parseApiErrorMessage };
