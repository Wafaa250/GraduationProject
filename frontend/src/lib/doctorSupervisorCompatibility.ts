export type DoctorSupervisorAiCompatibilityResult = {
  score: number;
  matches: string[];
};

export type DoctorExpertiseInput = {
  specialization?: string | null;
  technicalSkills?: string[] | null;
  researchSkills?: string[] | null;
};

type ParsedSkill = {
  display: string;
  normalized: string;
};

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

/** Mirrors RecommendedSupervisorHelper.ParseNormalizedProjectSkills — trim, drop empty, lowercase for matching. */
function parseRequiredSkills(requiredSkills: string[]): ParsedSkill[] {
  return requiredSkills
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => {
      const display = s.trim();
      return { display, normalized: normalizeSkill(display) };
    });
}

/**
 * Lowercase expertise corpus from specialization + technical + research skills.
 * Substring checks follow RecommendedSupervisorHelper (specialization.Contains(skill)).
 */
function buildExpertiseCorpus(expertise: DoctorExpertiseInput): string {
  const parts: string[] = [];
  const spec = expertise.specialization?.trim();
  if (spec) parts.push(spec);

  for (const skill of expertise.technicalSkills ?? []) {
    if (typeof skill === "string" && skill.trim()) parts.push(skill.trim());
  }
  for (const skill of expertise.researchSkills ?? []) {
    if (typeof skill === "string" && skill.trim()) parts.push(skill.trim());
  }

  return parts.join(" ").toLowerCase();
}

/**
 * Client-side supervisor compatibility for doctor supervision requests.
 * score = round((matched / totalRequiredSkills) * 100); 0 when no required skills.
 */
export function computeDoctorSupervisorAiCompatibility(
  requiredSkills: string[] | null | undefined,
  expertise: DoctorExpertiseInput,
): DoctorSupervisorAiCompatibilityResult {
  const skills = parseRequiredSkills(requiredSkills ?? []);
  const total = skills.length;

  if (total === 0) {
    return { score: 0, matches: [] };
  }

  const corpus = buildExpertiseCorpus(expertise);
  const matches: string[] = [];

  if (corpus.length > 0) {
    for (const skill of skills) {
      if (corpus.includes(skill.normalized)) {
        matches.push(skill.display);
      }
    }
  }

  const score = Math.round((matches.length / total) * 100);
  return { score, matches };
}

export function doctorExpertiseFromMe(me: {
  doctorProfile?: DoctorExpertiseInput | null;
}): DoctorExpertiseInput {
  const dp = me.doctorProfile;
  return {
    specialization: dp?.specialization ?? "",
    technicalSkills: dp?.technicalSkills ?? [],
    researchSkills: dp?.researchSkills ?? [],
  };
}
