const FORMATION_MARKER = "---skillswap-formation---";

export type AiFormationConfig = {
  teamSize: number;
  allowCrossSectionTeams: boolean;
  requiredSkills: string;
  balancePreference: string;
  aiMatchingNotes: string;
};

export function parseAiFormationFromDescription(description: string | null | undefined): {
  publicDescription: string;
  config: Partial<AiFormationConfig>;
} {
  const raw = description ?? "";
  const idx = raw.indexOf(FORMATION_MARKER);
  if (idx < 0) {
    return { publicDescription: raw.trim(), config: {} };
  }

  const publicDescription = raw.slice(0, idx).trim();
  const block = raw.slice(idx + FORMATION_MARKER.length).trim();
  const config: Partial<AiFormationConfig> = {};

  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Required skills:"))
      config.requiredSkills = trimmed.replace("Required skills:", "").trim();
    if (trimmed.startsWith("Balance preference:"))
      config.balancePreference = trimmed.replace("Balance preference:", "").trim();
    if (trimmed.startsWith("AI matching notes:"))
      config.aiMatchingNotes = trimmed.replace("AI matching notes:", "").trim();
  }

  return { publicDescription, config };
}

export function buildDescriptionWithFormation(
  publicDescription: string,
  config: Pick<AiFormationConfig, "requiredSkills" | "balancePreference" | "aiMatchingNotes">,
): string {
  const parts = [publicDescription.trim()];
  const formationLines = [
    config.requiredSkills.trim() ? `Required skills: ${config.requiredSkills.trim()}` : "",
    config.balancePreference.trim() ? `Balance preference: ${config.balancePreference.trim()}` : "",
    config.aiMatchingNotes.trim() ? `AI matching notes: ${config.aiMatchingNotes.trim()}` : "",
  ].filter(Boolean);

  if (formationLines.length > 0) {
    parts.push(FORMATION_MARKER, ...formationLines);
  }

  return parts.filter((p) => p.length > 0).join("\n");
}
