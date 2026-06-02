import api from "./axiosInstance";

export type SearchHit = {
  id: number;
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  avatarBase64?: string | null;
  roleType?: string | null;
  url: string;
  organizationId?: number | null;
};

export type GlobalSearchResponse = {
  students: SearchHit[];
  doctors: SearchHit[];
  companies: SearchHit[];
  associations: SearchHit[];
  projects: SearchHit[];
  projectRequests: SearchHit[];
  recruitmentCampaigns: SearchHit[];
  events: SearchHit[];
  opportunities: SearchHit[];
};

export type SearchSuggestionsResponse = {
  students: SearchHit[];
  companies: SearchHit[];
  associations: SearchHit[];
};

const EMPTY: GlobalSearchResponse = {
  students: [],
  doctors: [],
  companies: [],
  associations: [],
  projects: [],
  projectRequests: [],
  recruitmentCampaigns: [],
  events: [],
  opportunities: [],
};

function normalizeHits(value: unknown): SearchHit[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const hit = row as Record<string, unknown>;
    return {
      id: Number(hit.id ?? 0),
      title: String(hit.title ?? ""),
      subtitle: (hit.subtitle as string | null | undefined) ?? null,
      avatarUrl: (hit.avatarUrl as string | null | undefined) ?? null,
      avatarBase64: (hit.avatarBase64 as string | null | undefined) ?? null,
      roleType: (hit.roleType as string | null | undefined) ?? null,
      url: String(hit.url ?? "/"),
      organizationId: hit.organizationId != null ? Number(hit.organizationId) : null,
    };
  });
}

/** GET /api/search?q= */
export async function globalSearch(
  query: string,
  limit = 5,
): Promise<GlobalSearchResponse> {
  const term = query.trim();
  if (!term) return { ...EMPTY };

  const { data } = await api.get<GlobalSearchResponse>("/search", {
    params: { q: term, limit },
  });

  return {
    students: normalizeHits(data?.students),
    doctors: normalizeHits(data?.doctors),
    companies: normalizeHits(data?.companies),
    associations: normalizeHits(data?.associations),
    projects: normalizeHits(data?.projects),
    projectRequests: normalizeHits(data?.projectRequests),
    recruitmentCampaigns: normalizeHits(data?.recruitmentCampaigns),
    events: normalizeHits(data?.events),
    opportunities: normalizeHits(data?.opportunities),
  };
}

/** GET /api/search/suggestions */
export async function fetchSearchSuggestions(limit = 5): Promise<SearchSuggestionsResponse> {
  const { data } = await api.get<SearchSuggestionsResponse>("/search/suggestions", {
    params: { limit },
  });
  return {
    students: normalizeHits(data?.students),
    companies: normalizeHits(data?.companies),
    associations: normalizeHits(data?.associations),
  };
}

/** @deprecated Use globalSearch */
export async function searchPlatform(query: string) {
  const result = await globalSearch(query);
  return {
    students: result.students.map((s) => ({
      id: s.id,
      name: s.title,
      email: "",
      major: s.subtitle ?? "",
    })),
    doctors: result.doctors.map((d) => ({
      id: d.id,
      name: d.title,
      email: "",
      specialization: d.subtitle ?? "",
    })),
  };
}
