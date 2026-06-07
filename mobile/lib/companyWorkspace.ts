import { getItem, removeItem, setItem } from "@/utils/authStorage";
import { isCompanyOwnerAccountRole } from "@/utils/companyAccountRole";

export type CompanyWorkspaceRole = "owner" | "member";

export async function setStoredCompanyRole(role: string | null | undefined): Promise<void> {
  if (!role) {
    await removeItem("companyRole");
    return;
  }
  await setItem("companyRole", role.toLowerCase());
}

export async function getStoredCompanyRole(): Promise<CompanyWorkspaceRole | null> {
  const role = ((await getItem("companyRole")) ?? "").toLowerCase();
  if (role === "owner" || role === "member") return role;
  return null;
}

/** Account-level company owner (users.role === company). Member management only. */
export async function isCompanyOwner(): Promise<boolean> {
  const role = await getItem("role");
  return isCompanyOwnerAccountRole(role);
}

export function formatCompanyRole(role: string): string {
  return role.toLowerCase() === "owner" ? "Owner" : "Member";
}
