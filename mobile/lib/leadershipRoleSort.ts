export function getLeadershipRolePriority(roleTitle: string): number {
  const normalized = roleTitle.trim().toLowerCase();
  if (!normalized) return 100;
  if (containsWholeWord(normalized, "president") && !containsVicePresident(normalized)) return 0;
  if (containsVicePresident(normalized) || containsWholeWord(normalized, "vp")) return 1;
  if (containsWholeWord(normalized, "secretary")) return 2;
  if (containsWholeWord(normalized, "treasurer")) return 3;
  if (normalized.includes("coordinator")) return 4;
  return 100;
}

function containsVicePresident(normalized: string): boolean {
  return (
    normalized.includes("vice president") ||
    normalized.includes("vice-president") ||
    normalized.includes("vicepresident")
  );
}

function containsWholeWord(normalized: string, word: string): boolean {
  let index = 0;
  while ((index = normalized.indexOf(word, index)) >= 0) {
    const beforeOk = index === 0 || !/\w/.test(normalized[index - 1]!);
    const afterIndex = index + word.length;
    const afterOk = afterIndex >= normalized.length || !/\w/.test(normalized[afterIndex]!);
    if (beforeOk && afterOk) return true;
    index += word.length;
  }
  return false;
}

export function sortByLeadershipRole<T extends { roleTitle: string; createdAt?: string; id?: number }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const priorityDiff = getLeadershipRolePriority(a.roleTitle) - getLeadershipRolePriority(b.roleTitle);
    if (priorityDiff !== 0) return priorityDiff;
    const titleDiff = a.roleTitle.localeCompare(b.roleTitle, undefined, { sensitivity: "base" });
    if (titleDiff !== 0) return titleDiff;
    if (a.createdAt && b.createdAt) {
      const dateDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (dateDiff !== 0) return dateDiff;
    }
    return (a.id ?? 0) - (b.id ?? 0);
  });
}
