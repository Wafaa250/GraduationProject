export function initialsFromName(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, max)
    .toUpperCase();
}

export function matchScoreClass(match: number): string {
  if (match >= 92) return "text-success bg-success/10";
  if (match >= 88) return "text-primary bg-primary/10";
  return "text-warning bg-warning/10";
}

const TEAMMATE_GRADIENTS = [
  "from-pink-100 to-primary-soft",
  "from-primary-soft to-blue-100",
  "from-amber-100 to-pink-100",
];

export function teammateCardGradient(index: number): string {
  return TEAMMATE_GRADIENTS[index % TEAMMATE_GRADIENTS.length];
}

export function formatStatValue(value: number | null | undefined): string {
  if (value == null || value <= 0) return "—";
  return String(value);
}

export function formatPercentStat(value: number | null | undefined): string {
  if (value == null || value <= 0) return "—";
  return `${value}%`;
}
