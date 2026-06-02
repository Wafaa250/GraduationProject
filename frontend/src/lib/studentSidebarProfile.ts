const MAX_VISIBLE_SKILL_CHIPS = 8;

export function mergeStudentSkillLabels(
  roles: string[] = [],
  technical: string[] = [],
  tools: string[] = [],
  general: string[] = [],
  major: string[] = [],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...roles, ...technical, ...tools, ...general, ...major]) {
    const t = s.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export function getStudentProfilePhotoUrl(
  profilePictureBase64?: string | null,
): string | null {
  const raw = profilePictureBase64?.trim();
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  return `data:image/jpeg;base64,${raw}`;
}

export function formatStudentSidebarSubtitle(
  major?: string | null,
  academicYear?: string | null,
): string | null {
  const m = major?.trim();
  const y = academicYear?.trim();
  if (m && y) return `${m} • ${y}`;
  return m || y || null;
}

export function formatStudentHandleFromEmail(email?: string | null): string | null {
  const raw = email?.trim();
  if (!raw || !raw.includes("@")) return null;
  const local = raw.split("@")[0]?.trim();
  return local ? `@${local}` : null;
}

export function buildSidebarBioLine(
  bio: string | null | undefined,
  faculty: string | null | undefined,
  skills: string[],
  maxSkills = MAX_VISIBLE_SKILL_CHIPS,
): { text: string | null; overflow: number } {
  const parts: string[] = [];
  if (bio?.trim()) parts.push(bio.trim());
  if (faculty?.trim()) parts.push(faculty.trim());

  const visible = skills.slice(0, maxSkills);
  const overflow = Math.max(0, skills.length - maxSkills);
  parts.push(...visible);

  if (parts.length === 0) return { text: null, overflow: 0 };

  let text = parts.join(" | ");
  if (overflow > 0) text += ` | +${overflow} more`;
  return { text, overflow };
}

export function partitionSkillChips(skills: string[], maxVisible = MAX_VISIBLE_SKILL_CHIPS) {
  if (skills.length <= maxVisible) {
    return { visible: skills, overflow: 0 };
  }
  return {
    visible: skills.slice(0, maxVisible),
    overflow: skills.length - maxVisible,
  };
}
