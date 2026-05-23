/** Academic year options — must stay in sync with backend `StudentRegisterService.ValidYears`. */

export const ACADEMIC_YEAR_OPTIONS = [
  { value: 'First Year', label: 'First Year' },
  { value: 'Second Year', label: 'Second Year' },
  { value: 'Third Year', label: 'Third Year' },
  { value: 'Fourth Year', label: 'Fourth Year' },
  { value: 'Fifth Year or Above', label: 'Fifth Year or Above' },
] as const

export const ACADEMIC_YEAR_VALUES = ACADEMIC_YEAR_OPTIONS.map((o) => o.value)
