import api, { parseApiErrorMessage } from "./axiosInstance";
import { normalizeFeedItem, type FeedItem } from "@/lib/feedTypes";

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
  isFollowing: boolean;
};

export type FeedSuggestedAssociation = {
  organizationId: number;
  name: string;
  category?: string | null;
  faculty?: string | null;
  logoUrl?: string | null;
  isFollowing: boolean;
};

export type FeedTrendingItem = {
  postKey: string;
  title: string;
  authorName: string;
  kind: string;
  publishedAt: string;
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
  trendingOpportunities: FeedTrendingItem[];
};

export type FeedResponse = {
  items: FeedItem[];
  sidebar: FeedSidebarSummary;
  suggestions: FeedSuggestions;
  searchResults: FeedDiscoverMember[];
};

export async function getCommunicationFeed(search?: string): Promise<FeedResponse> {
  const params = search?.trim() ? { search: search.trim() } : undefined;
  const { data } = await api.get<{ items?: Record<string, unknown>[] } & FeedResponse>("/feed", {
    params,
  });
  const rawItems = data?.items ?? [];
  return {
    items: rawItems.map((row) => normalizeFeedItem(row as Record<string, unknown>)),
    sidebar: data?.sidebar ?? { role: "student" },
    suggestions: data?.suggestions ?? {
      suggestedCompanies: [],
      suggestedAssociations: [],
      discoverMembers: [],
      trendingOpportunities: [],
    },
    searchResults: data?.searchResults ?? [],
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
