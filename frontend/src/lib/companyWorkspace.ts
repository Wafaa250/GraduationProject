import {
  isCompanyOwnerAccountRole,
  isCompanyWorkspaceAccountRole,
} from "@/lib/companyAccountRole";

export type CompanyWorkspaceRole = "owner" | "member";

export { isCompanyWorkspaceAccountRole, isCompanyOwnerAccountRole };

const STORAGE_KEY = "companyRole";

export function getStoredCompanyRole(): CompanyWorkspaceRole | null {
  const role = (localStorage.getItem(STORAGE_KEY) ?? "").toLowerCase();
  if (role === "owner" || role === "member") return role;
  return null;
}

export function setStoredCompanyRole(role: string | null | undefined): void {
  if (!role) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, role.toLowerCase());
}

/** Workspace membership role (company_members.role). */
export function isCompanyWorkspaceOwner(): boolean {
  return getStoredCompanyRole() === "owner";
}

/** Account-level company owner (users.role === company). Member management only. */
export function isCompanyOwner(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return isCompanyOwnerAccountRole(localStorage.getItem("role"));
  } catch {
    const role = (localStorage.getItem("role") ?? "").toLowerCase().replace(/[\s_-]/g, "");
    return role === "company";
  }
}

/** @alias isCompanyOwner */
export const canManageCompanyMembers = isCompanyOwner;

export function formatCompanyRole(role: string): string {
  return role.toLowerCase() === "owner" ? "Owner" : "Member";
}
