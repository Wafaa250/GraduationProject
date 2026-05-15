/**
 * Matches backend + web `isAssociationRole` behavior.
 */
export function isAssociationRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r === "studentassociation" || r === "association";
}
