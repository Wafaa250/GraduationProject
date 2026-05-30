const RANGE_BEFORE = 10;
const RANGE_AFTER = 20;

export function formatAcademicYear(startYear: number): string {
  return `${startYear} / ${startYear + 1}`;
}

export function getStartYearOptions(
  anchorYear = new Date().getFullYear(),
): number[] {
  const min = anchorYear - RANGE_BEFORE;
  const max = anchorYear + RANGE_AFTER;
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}
