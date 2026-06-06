export type GraduationProjectType = "GP1" | "GP2" | "GP";

export type GraduationTrack = "general" | "engineering" | "computer-engineering";

export const GRADUATION_PROJECT_TYPE = {
  GP1: "GP1",
  GP2: "GP2",
  GP: "GP",
} as const satisfies Record<string, GraduationProjectType>;

export function isEngineeringFaculty(faculty: string | null | undefined): boolean {
  if (!faculty?.trim()) return false;
  return faculty.trim().toLowerCase().includes("engineering");
}

export function isComputerEngineeringMajor(majorOrDepartment: string | null | undefined): boolean {
  if (!majorOrDepartment?.trim()) return false;
  const m = majorOrDepartment.trim().toLowerCase();
  return m === "computer engineering" || m.includes("computer engineering");
}

export function resolveGraduationTrack(
  faculty: string | null | undefined,
  major: string | null | undefined,
): GraduationTrack {
  if (!isEngineeringFaculty(faculty)) return "general";
  if (isComputerEngineeringMajor(major)) return "computer-engineering";
  return "engineering";
}

export function normalizeProjectType(type: string | null | undefined): GraduationProjectType {
  const t = (type ?? GRADUATION_PROJECT_TYPE.GP).trim().toUpperCase();
  if (t === GRADUATION_PROJECT_TYPE.GP1) return GRADUATION_PROJECT_TYPE.GP1;
  if (t === GRADUATION_PROJECT_TYPE.GP2) return GRADUATION_PROJECT_TYPE.GP2;
  return GRADUATION_PROJECT_TYPE.GP;
}

export function getGraduationSectionTitle(
  faculty: string | null | undefined,
  major: string | null | undefined,
): string {
  return resolveGraduationTrack(faculty, major) === "general"
    ? "Graduation Project"
    : "Graduation Projects";
}

export function projectTypeLabel(
  type: string | null | undefined,
  faculty?: string | null,
  major?: string | null,
): string {
  const normalized = normalizeProjectType(type);
  const track = resolveGraduationTrack(faculty, major);

  if (track === "general") return "Graduation Project";

  if (track === "computer-engineering") {
    if (normalized === GRADUATION_PROJECT_TYPE.GP1) return "Graduation Project 1 (Software)";
    if (normalized === GRADUATION_PROJECT_TYPE.GP2) return "Graduation Project 2 (Hardware)";
    return "Graduation Project";
  }

  if (normalized === GRADUATION_PROJECT_TYPE.GP1) return "Graduation Project 1";
  if (normalized === GRADUATION_PROJECT_TYPE.GP2) return "Graduation Project 2";
  return "Graduation Project";
}

/** Labels shown during registration after faculty/major selection. */
export function getRegistrationGraduationCourses(
  faculty: string | null | undefined,
  major: string | null | undefined,
): string[] {
  const track = resolveGraduationTrack(faculty, major);

  if (track === "general") {
    return ["Graduation Project"];
  }

  if (track === "computer-engineering") {
    return ["Graduation Project 1 (Software)", "Graduation Project 2 (Hardware)"];
  }

  return ["Graduation Project 1", "Graduation Project 2"];
}

export type GraduationProjectTypeOption = {
  type: GraduationProjectType;
  stageId: "gp1" | "gp2" | "gp";
  label: string;
  shortLabel: string;
  description: string;
};

export function projectTypeToStage(type: string | null | undefined): "gp1" | "gp2" | "gp" {
  switch (normalizeProjectType(type)) {
    case GRADUATION_PROJECT_TYPE.GP1:
      return "gp1";
    case GRADUATION_PROJECT_TYPE.GP2:
      return "gp2";
    default:
      return "gp";
  }
}

export function stageToProjectType(stage: string): GraduationProjectType {
  if (stage === "gp1") return GRADUATION_PROJECT_TYPE.GP1;
  if (stage === "gp2") return GRADUATION_PROJECT_TYPE.GP2;
  return GRADUATION_PROJECT_TYPE.GP;
}

export function getGraduationProjectTypeOptions(
  faculty: string | null | undefined,
  major: string | null | undefined,
): GraduationProjectTypeOption[] {
  const track = resolveGraduationTrack(faculty, major);

  if (track === "general") {
    return [
      {
        type: GRADUATION_PROJECT_TYPE.GP,
        stageId: "gp",
        label: "Graduation Project",
        shortLabel: "Graduation Project",
        description: "Single graduation project track for your faculty.",
      },
    ];
  }

  if (track === "computer-engineering") {
    return [
      {
        type: GRADUATION_PROJECT_TYPE.GP1,
        stageId: "gp1",
        label: "Graduation Project 1 (Software)",
        shortLabel: "GP1 Software",
        description: "Software-focused graduation project.",
      },
      {
        type: GRADUATION_PROJECT_TYPE.GP2,
        stageId: "gp2",
        label: "Graduation Project 2 (Hardware)",
        shortLabel: "GP2 Hardware",
        description: "Hardware-focused graduation project.",
      },
    ];
  }

  return [
    {
      type: GRADUATION_PROJECT_TYPE.GP1,
      stageId: "gp1",
      label: "Graduation Project 1",
      shortLabel: "Graduation Project 1",
      description: "First graduation project stage.",
    },
    {
      type: GRADUATION_PROJECT_TYPE.GP2,
      stageId: "gp2",
      label: "Graduation Project 2",
      shortLabel: "Graduation Project 2",
      description: "Second graduation project stage.",
    },
  ];
}
