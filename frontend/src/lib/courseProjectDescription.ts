const FORMATION_MARKER = "---skillswap-formation---";

/** Mirrors doctor course project description format (public text + formation block). */
export function parseCourseProjectDescription(description: string | null | undefined): {
  publicDescription: string;
  requiredSkills: string[];
} {
  const raw = description ?? "";
  const idx = raw.indexOf(FORMATION_MARKER);
  const publicPart = idx < 0 ? raw.trim() : raw.slice(0, idx).trim();
  const block = idx < 0 ? "" : raw.slice(idx + FORMATION_MARKER.length).trim();

  const skills: string[] = [];
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Required skills:")) {
      const value = trimmed.replace("Required skills:", "").trim();
      if (value) {
        skills.push(
          ...value
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }
    }
  }

  if (skills.length === 0) {
    const jsonSkills = tryParseJsonStringList(publicPart === raw ? raw : description);
    if (jsonSkills.length > 0) {
      return { publicDescription: "", requiredSkills: jsonSkills };
    }
  }

  return { publicDescription: publicPart, requiredSkills: [...new Set(skills)] };
}

function tryParseJsonStringList(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
  } catch {
    return [];
  }
}
