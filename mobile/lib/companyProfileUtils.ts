import type { CompanyProfile } from "@/api/companyApi";

export type CompanyProfileFormState = {
  companyName: string;
  about: string;
  industry: string;
  website: string;
  headquartersLocation: string;
  workingStyle: string;
  contactEmail: string;
  linkedInUrl: string;
  optionalContactLink: string;
  areasOfInterest: string[];
};

export function applyProfileToForm(profile: CompanyProfile): CompanyProfileFormState {
  return {
    companyName: profile.companyName ?? "",
    about: profile.description ?? "",
    industry: profile.industry ?? "",
    website: profile.websiteUrl ?? "",
    headquartersLocation: profile.headquartersLocation ?? profile.location ?? "",
    workingStyle: profile.workingStyle ?? "",
    contactEmail: profile.contactEmail ?? profile.email ?? "",
    linkedInUrl: profile.linkedInUrl ?? "",
    optionalContactLink: profile.optionalContactLink ?? "",
    areasOfInterest: profile.areasOfInterest ?? [],
  };
}

export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function emptyLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}
