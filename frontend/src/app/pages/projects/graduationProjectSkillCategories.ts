/**
 * Frontend-only UX grouping for graduation project skill chips.
 * Does not affect API payloads — only how suggestions are visually organized.
 */

export type SkillUxCategoryId =
  | "software_ai"
  | "embedded_hardware"
  | "networking_security"
  | "architecture_engineering"
  | "design_creative"
  | "media_content"
  | "business_mgmt"
  | "data_research"
  | "health_medicine"
  | "education"
  | "general";

export const SKILL_UX_CATEGORY_ORDER: {
  id: SkillUxCategoryId;
  label: string;
  hint: string;
}[] = [
  {
    id: "software_ai",
    label: "Software & AI",
    hint: "Apps, platforms, ML, and programming",
  },
  {
    id: "embedded_hardware",
    label: "Embedded & hardware",
    hint: "Circuits, firmware, robotics, instrumentation",
  },
  {
    id: "networking_security",
    label: "Networking & security",
    hint: "Telecom, RF, protocols, cyber",
  },
  {
    id: "architecture_engineering",
    label: "Architecture & engineering",
    hint: "Built environment, civil, mechanical, energy",
  },
  {
    id: "design_creative",
    label: "Design & creative",
    hint: "UX, visual design, branding",
  },
  {
    id: "media_content",
    label: "Media & content",
    hint: "Storytelling, campaigns, production",
  },
  {
    id: "business_mgmt",
    label: "Business & management",
    hint: "Strategy, ops, marketing, coordination",
  },
  {
    id: "data_research",
    label: "Data & research",
    hint: "Analytics, lab work, scientific methods",
  },
  {
    id: "health_medicine",
    label: "Health & medicine",
    hint: "Clinical, public health, biomedical",
  },
  {
    id: "education",
    label: "Education & learning",
    hint: "Teaching, curriculum, learning design",
  },
  {
    id: "general",
    label: "Other & cross-disciplinary",
    hint: "Broad or mixed skills",
  },
];

/**
 * Best-effort bucket for display only. Tuned for false negatives → "general"
 * rather than wrong silos when unsure.
 */
export function inferSkillUxCategory(text: string): SkillUxCategoryId {
  const s = text.toLowerCase();

  if (
    /\b(medical|clinical|patient|hospital|healthcare|pharma|diagnostic|nursing|surgery|therapeutic|epidemiolog|biomedical|ehr\b|health data|health information)\b/.test(
      s,
    )
  ) {
    return "health_medicine";
  }

  if (
    /\b(curriculum|pedagogy|teaching|classroom|instructional design|edtech|learning sciences|assessment design|educational research|tutoring|academic advising)\b/.test(
      s,
    )
  ) {
    return "education";
  }

  if (
    /\b(embedded|fpga|vhdl|verilog|firmware|microcontroller|stm32|arduino|raspberry|plc\b|pcb|hardware design|iot\b|servo|actuator|instrumentation|kinematics|dynamics|motion control|real-time control)\b/.test(
      s,
    )
  ) {
    return "embedded_hardware";
  }

  if (
    /\b(wireless|telecom|telecommunication|cellular|5g|rf\b|antenna|dsp\b|fiber|network protocol|cyber|security|penetration|vpn|firewall|routing|sdn\b|gnu radio|channel model|information theory)\b/.test(
      s,
    )
  ) {
    return "networking_security";
  }

  if (
    /\b(civil|structural|geotechn|hydraul|bim\b|architectural|construction|reinforced concrete|steel design|surveying|transportation engineer|mep\b|hvac|building energy|urban design|etabs|staad|plaxis|revit|sap2000)\b/.test(
      s,
    )
  ) {
    return "architecture_engineering";
  }

  if (
    /\b(ui\/ux|ui\b|ux\b|graphic design|visual design|branding|figma|prototype|typography|creative director)\b/.test(
      s,
    )
  ) {
    return "design_creative";
  }

  if (
    /\b(media\b|content strategy|videography|filmmaking|journalism|broadcast|storytelling|copywriting|public relations|social media)\b/.test(
      s,
    )
  ) {
    return "media_content";
  }

  if (
    /\b(marketing|business strategy|finance|management consultant|project coordinator|operations research|supply chain|entrepreneur|lean\b|six sigma|hr\b|human resources|sales strategy)\b/.test(
      s,
    )
  ) {
    return "business_mgmt";
  }

  if (
    /\b(research assistant|research scientist|statistician|laboratory|experimental design|scientific writing|hypothesis|data modeling|spss\b|visualization|academic research)\b/.test(
      s,
    )
  ) {
    return "data_research";
  }

  if (
    /\b(software|developer|programmer|programming|web dev|full stack|frontend|backend|api\b|saas|cloud|devops|machine learning|deep learning|\bai\b|\bml\b|nlp|react|node\.?js|javascript|typescript|python|java\b|kubernetes|docker|git\b|game dev|qa\b|tester|cybersecurity specialist)\b/.test(
      s,
    )
  ) {
    return "software_ai";
  }

  if (
    /\b(mechanical|electrical engineer|power system|renewable energy|solar pv|wind resource|manufacturing|thermodynamic|fluid mechanics|materials selection|fe\b|fea\b|cad\b|control systems engineer|industrial engineer)\b/.test(
      s,
    )
  ) {
    return "architecture_engineering";
  }

  if (
    /\b(data scientist|data analyst|data analysis|analytics|database|sql\b|statistics|statistical)\b/.test(
      s,
    )
  ) {
    return "data_research";
  }

  return "general";
}

export function groupStringsByUxCategory(items: string[]): Map<SkillUxCategoryId, string[]> {
  const map = new Map<SkillUxCategoryId, string[]>();
  for (const id of SKILL_UX_CATEGORY_ORDER.map((c) => c.id)) {
    map.set(id, []);
  }
  for (const item of items) {
    const cat = inferSkillUxCategory(item);
    map.get(cat)!.push(item);
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => a.localeCompare(b));
  }
  return map;
}
