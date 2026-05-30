/** Canonical graduation project type codes stored in the database. */
export type GraduationProjectType = 'GP1' | 'GP2' | 'GP'

export type GraduationTrack = 'general' | 'engineering' | 'computer-engineering'

export type GraduationProjectTypeOption = {
  type: GraduationProjectType
  label: string
  shortLabel: string
  description: string
}

export const GRADUATION_PROJECT_TYPE = {
  GP1: 'GP1',
  GP2: 'GP2',
  GP: 'GP',
} as const satisfies Record<string, GraduationProjectType>

/** Any faculty whose name includes "Engineering". */
export function isEngineeringFaculty(faculty: string | null | undefined): boolean {
  if (!faculty?.trim()) return false
  return faculty.trim().toLowerCase().includes('engineering')
}

/** @deprecated Use isEngineeringFaculty */
export const isEngineeringOrITFaculty = isEngineeringFaculty

export function isComputerEngineeringMajor(majorOrDepartment: string | null | undefined): boolean {
  if (!majorOrDepartment?.trim()) return false
  const m = majorOrDepartment.trim().toLowerCase()
  return m === 'computer engineering' || m.includes('computer engineering')
}

export function resolveGraduationTrack(
  faculty: string | null | undefined,
  major: string | null | undefined,
): GraduationTrack {
  if (!isEngineeringFaculty(faculty)) return 'general'
  if (isComputerEngineeringMajor(major)) return 'computer-engineering'
  return 'engineering'
}

export function normalizeProjectType(type: string | null | undefined): GraduationProjectType {
  const t = (type ?? GRADUATION_PROJECT_TYPE.GP).trim().toUpperCase()
  if (t === GRADUATION_PROJECT_TYPE.GP1) return GRADUATION_PROJECT_TYPE.GP1
  if (t === GRADUATION_PROJECT_TYPE.GP2) return GRADUATION_PROJECT_TYPE.GP2
  return GRADUATION_PROJECT_TYPE.GP
}

export function getGraduationProjectTypeOptions(
  faculty: string | null | undefined,
  major: string | null | undefined,
): GraduationProjectTypeOption[] {
  const track = resolveGraduationTrack(faculty, major)

  if (track === 'general') {
    return [
      {
        type: GRADUATION_PROJECT_TYPE.GP,
        label: 'Graduation Project',
        shortLabel: 'Graduation Project',
        description: 'Single graduation project track for your faculty.',
      },
    ]
  }

  if (track === 'computer-engineering') {
    return [
      {
        type: GRADUATION_PROJECT_TYPE.GP1,
        label: 'Graduation Project 1 (Software)',
        shortLabel: 'GP1 Software',
        description: 'Software-focused graduation project.',
      },
      {
        type: GRADUATION_PROJECT_TYPE.GP2,
        label: 'Graduation Project 2 (Hardware)',
        shortLabel: 'GP2 Hardware',
        description: 'Hardware-focused graduation project.',
      },
    ]
  }

  return [
    {
      type: GRADUATION_PROJECT_TYPE.GP1,
      label: 'Graduation Project 1',
      shortLabel: 'Graduation Project 1',
      description: 'Foundational graduation project stage.',
    },
    {
      type: GRADUATION_PROJECT_TYPE.GP2,
      label: 'Graduation Project 2',
      shortLabel: 'Graduation Project 2',
      description: 'Implementation graduation project stage.',
    },
  ]
}

export function resolveGraduationProjectLabel(
  faculty: string | null | undefined,
  major: string | null | undefined,
  courseType: string | null | undefined,
): string {
  return (
    getGraduationProjectTypeOptions(faculty, major).find(
      (o) => o.type === normalizeProjectType(courseType),
    )?.label ?? 'Graduation Project'
  )
}

export function projectTypeForApi(
  faculty: string | null | undefined,
  major: string | null | undefined,
  selected: GraduationProjectType,
): GraduationProjectType {
  const options = getGraduationProjectTypeOptions(faculty, major)
  if (options.length === 1) return GRADUATION_PROJECT_TYPE.GP
  return selected === GRADUATION_PROJECT_TYPE.GP1 || selected === GRADUATION_PROJECT_TYPE.GP2
    ? selected
    : GRADUATION_PROJECT_TYPE.GP1
}
