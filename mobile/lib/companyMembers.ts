import type { CompanyMember } from "@/api/companyApi";

export function sortCompanyMembers(members: CompanyMember[]): CompanyMember[] {
  return [...members].sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === "owner" ? -1 : 1;
  });
}

export function memberInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
