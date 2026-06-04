import api from "./axiosInstance";

export type FollowingCompany = {
  id: number;
  name: string;
  logoUrl: string | null;
  industry: string | null;
};

export type FollowingAssociation = {
  id: number;
  name: string;
  logoUrl: string | null;
  category: string | null;
};

export type FollowingListResponse = {
  companies: FollowingCompany[];
  associations: FollowingAssociation[];
};

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[pascal] !== undefined && raw[pascal] !== null) return raw[pascal] as T;
  return undefined;
}

function normalizeCompany(row: Record<string, unknown>): FollowingCompany {
  return {
    id: Number(readField<number>(row, "id", "Id") ?? 0),
    name: String(readField<string>(row, "name", "Name") ?? "").trim() || "Company",
    logoUrl: (readField<string | null>(row, "logoUrl", "LogoUrl") ?? null) || null,
    industry: (readField<string | null>(row, "industry", "Industry") ?? null) || null,
  };
}

function normalizeAssociation(row: Record<string, unknown>): FollowingAssociation {
  return {
    id: Number(readField<number>(row, "id", "Id") ?? 0),
    name: String(readField<string>(row, "name", "Name") ?? "").trim() || "Organization",
    logoUrl: (readField<string | null>(row, "logoUrl", "LogoUrl") ?? null) || null,
    category: (readField<string | null>(row, "category", "Category") ?? null) || null,
  };
}

export async function getFollowing(): Promise<FollowingListResponse> {
  const { data } = await api.get<Record<string, unknown>>("/following");
  const raw = data ?? {};
  const companiesRaw = readField<unknown[]>(raw, "companies", "Companies") ?? [];
  const associationsRaw = readField<unknown[]>(raw, "associations", "Associations") ?? [];
  return {
    companies: companiesRaw.map((row) => normalizeCompany(row as Record<string, unknown>)),
    associations: associationsRaw.map((row) => normalizeAssociation(row as Record<string, unknown>)),
  };
}

export { followCompany, unfollowCompany, followOrganization, unfollowOrganization } from "./feedApi";
