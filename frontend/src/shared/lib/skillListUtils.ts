export function normalizeSkillLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isDuplicateSkill(value: string, existing: readonly string[]): boolean {
  const normalized = normalizeSkillLabel(value).toLowerCase()
  if (!normalized) return true
  return existing.some((item) => item.toLowerCase() === normalized)
}

/** Suggested catalog first, then custom entries not already in the catalog. */
export function mergeSkillItems(
  suggested: readonly string[],
  custom: readonly string[],
): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const item of [...suggested, ...custom]) {
    const label = normalizeSkillLabel(item)
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(label)
  }

  return merged
}
