/** Shapes recommendation copy for the student profile — deduped, no invented text. */

export type AiMatchDisplay = {
  summary: string;
  keyReasons: string[];
  suggestedRole: string | null;
};

function normalizeLine(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function linesAreSimilar(a: string, b: string): boolean {
  const na = normalizeLine(a);
  const nb = normalizeLine(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 12 && nb.length > 12 && (na.includes(nb) || nb.includes(na))) return true;

  const wordsA = na.split(" ").filter((w) => w.length > 2);
  const wordsB = nb.split(" ").filter((w) => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const setB = new Set(wordsB);
  let overlap = 0;
  for (const w of wordsA) {
    if (setB.has(w)) overlap++;
  }
  const ratio = overlap / Math.min(wordsA.length, wordsB.length);
  return ratio >= 0.72;
}

function dedupeLines(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (result.some((existing) => linesAreSimilar(existing, trimmed))) continue;
    result.push(trimmed);
  }
  return result;
}

type RecommendationCopy = {
  reasonSummary: string;
  highlights: string[];
  strengths: string[];
  alignedRoleName?: string | null;
};

export function buildAiMatchDisplay(
  recommendation: RecommendationCopy,
  fallbackRole?: string | null,
): AiMatchDisplay {
  const bullets = dedupeLines([...recommendation.highlights, ...recommendation.strengths]);
  let summary = recommendation.reasonSummary.trim();

  if (summary && bullets.some((b) => linesAreSimilar(summary, b))) {
    if (summary.length < 80) {
      summary = "";
    }
  }

  if (!summary && bullets.length > 0) {
    const paragraph = bullets.find((b) => b.length > 60) ?? bullets[0];
    summary = paragraph;
  }

  const keyReasons = bullets
    .filter((line) => !summary || !linesAreSimilar(line, summary))
    .slice(0, 3);

  const suggestedRole =
    recommendation.alignedRoleName?.trim() || fallbackRole?.trim() || null;

  return { summary, keyReasons, suggestedRole };
}
