import { removeItem, setItem, getItem } from "@/utils/authStorage";

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
