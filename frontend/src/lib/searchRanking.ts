import type { CommunicationHubSearchResults, FeedSearchResultRow } from "@/api/feedApi";

const GROUP_LIMIT = 5;

/** Backend fetch pool — frontend keeps top 5 per group after filter/rank. */
export const SEARCH_FETCH_LIMIT = 20;

const GROUP_KEYS: (keyof CommunicationHubSearchResults)[] = [
  "students",
  "doctors",
  "companies",
  "associations",
  "projects",
  "events",
  "opportunities",
];

function normalize(value: string): string {
  const input = value.trim();
  if (!input) return "";
  try {
    return input
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  } catch {
    return input.toLowerCase();
  }
}

function extractUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("@")) return normalize(trimmed.slice(1));
  const at = trimmed.indexOf("@");
  if (at > 0) return normalize(trimmed.slice(0, at));
  return null;
}

function searchableFields(row: FeedSearchResultRow) {
  const nameRaw = row.name ?? "";
  const emailRaw = row.email?.trim() || (nameRaw.includes("@") ? nameRaw : "");
  const usernameRaw = row.username?.trim() || extractUsername(emailRaw) || extractUsername(nameRaw);

  return {
    name: normalize(nameRaw),
    email: emailRaw ? normalize(emailRaw) : "",
    username: usernameRaw ? normalize(usernameRaw) : "",
    subtitle: normalize(row.subtitle ?? ""),
  };
}

function haystack(fields: ReturnType<typeof searchableFields>): string {
  return [fields.name, fields.email, fields.username, fields.subtitle].filter(Boolean).join(" ");
}

/** Returns -1 if no match; lower score = more relevant. */
export function relevanceScore(row: FeedSearchResultRow, query: string): number {
  const q = normalize(query);
  if (q.length === 0) return -1;

  const f = searchableFields(row);
  if (!haystack(f).includes(q)) return -1;

  const nameTokens = f.name.split(/\s+/).filter(Boolean);
  const exactName = f.name === q || nameTokens.some((t) => t === q);
  if (exactName) return 1;

  if (f.name.startsWith(q) || nameTokens.some((t) => t.startsWith(q))) return 2;

  if (f.username && f.username.startsWith(q)) return 3;

  if (f.email && f.email.startsWith(q)) return 4;

  if (f.name.includes(q) || nameTokens.some((t) => t.includes(q))) return 5;

  if (f.username && f.username.includes(q)) return 6;

  if (f.email && f.email.includes(q)) return 6;

  if (f.subtitle.includes(q)) return 7;

  return 8;
}

export function rowMatchesQuery(row: FeedSearchResultRow, query: string): boolean {
  return relevanceScore(row, query) > 0;
}

export const PEOPLE_SEARCH_KEYS: (keyof CommunicationHubSearchResults)[] = [
  "students",
  "doctors",
  "companies",
  "associations",
];

export function hasPeopleSearchResults(results: CommunicationHubSearchResults): boolean {
  return PEOPLE_SEARCH_KEYS.some((key) => results[key].length > 0);
}

export function hasSearchResults(results: CommunicationHubSearchResults): boolean {
  return GROUP_KEYS.some((key) => results[key].length > 0);
}

export function searchResultDedupKey(row: FeedSearchResultRow): string {
  const type = row.entityType.toLowerCase();
  if (type === "company" && row.entityId <= 0 && row.userId) {
    return `company:orphan:${row.userId}`;
  }
  return `${type}:${row.entityId}`;
}

export function filterAndRankSearchRows(
  rows: FeedSearchResultRow[],
  query: string,
  limit = GROUP_LIMIT,
  trustBackend = false,
): FeedSearchResultRow[] {
  const ranked = rows
    .map((row) => {
      let score = relevanceScore(row, query);
      if (trustBackend && score < 0) score = 8;
      return { row, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.row.name.localeCompare(b.row.name, undefined, { sensitivity: "base" });
    });

  const seen = new Set<string>();
  const out: FeedSearchResultRow[] = [];
  for (const { row } of ranked) {
    const key = searchResultDedupKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

export function mergeSearchResults(
  primary: CommunicationHubSearchResults,
  secondary: CommunicationHubSearchResults,
): CommunicationHubSearchResults {
  const merged = { ...primary };
  for (const key of GROUP_KEYS) {
    const seen = new Set(merged[key].map((r) => searchResultDedupKey(r)));
    for (const row of secondary[key]) {
      const id = searchResultDedupKey(row);
      if (seen.has(id)) continue;
      seen.add(id);
      merged[key].push(row);
    }
  }
  return merged;
}

export function filterAndRankSearchResults(
  results: CommunicationHubSearchResults,
  query: string,
  options?: { trustBackend?: boolean },
): CommunicationHubSearchResults {
  const trustBackend = options?.trustBackend === true;
  /** Companies/associations are pre-filtered by API; do not drop on client haystack mismatch. */
  const trustDiscoverable = true;
  return {
    students: filterAndRankSearchRows(results.students, query, GROUP_LIMIT, trustBackend),
    doctors: filterAndRankSearchRows(results.doctors, query, GROUP_LIMIT, trustBackend),
    companies: filterAndRankSearchRows(
      results.companies,
      query,
      GROUP_LIMIT,
      trustBackend || trustDiscoverable,
    ),
    associations: filterAndRankSearchRows(
      results.associations,
      query,
      GROUP_LIMIT,
      trustBackend || trustDiscoverable,
    ),
    projects: filterAndRankSearchRows(results.projects, query, GROUP_LIMIT, trustBackend),
    events: filterAndRankSearchRows(results.events, query, GROUP_LIMIT, trustBackend),
    opportunities: filterAndRankSearchRows(results.opportunities, query, GROUP_LIMIT, trustBackend),
  };
}
