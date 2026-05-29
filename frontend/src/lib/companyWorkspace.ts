export type CompanyWorkspaceRole = "owner" | "member";

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

export function isCompanyOwner(): boolean {
  return getStoredCompanyRole() === "owner";
}

export function formatCompanyRole(role: string): string {
  return role.toLowerCase() === "owner" ? "Owner" : "Member";
}
