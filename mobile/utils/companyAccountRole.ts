export function normalizeAccountRole(role: string | null | undefined): string {
  return (role ?? "").toLowerCase().replace(/[\s_-]/g, "");
}

export function isCompanyWorkspaceAccountRole(role: string | null | undefined): boolean {
  const r = normalizeAccountRole(role);
  return r === "company" || r === "companymember";
}
