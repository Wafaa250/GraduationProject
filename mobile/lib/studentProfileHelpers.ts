import type { GradProject } from "@/api/gradProjectApi";
import type { ProfileStrength } from "@/api/dashboardApi";
import type { StudentMeResponse } from "@/api/meApi";

export function displayText(value: string | null | undefined, fallback = "Not provided yet."): string {
  const v = value?.trim();
  return v ? v : fallback;
}

export function formatGpa(gpa: number | null | undefined): string {
  if (gpa == null || Number.isNaN(gpa)) return "—";
  return `${gpa} / 4.0`;
}

export function uniqueStrings(items: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const v = item?.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

export function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export function linkHandle(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export function projectDuration(createdAt?: string): string {
  if (!createdAt) return "—";
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "—";
  const months = Math.max(
    1,
    Math.round((Date.now() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)),
  );
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year" : `${years} years`;
}

export function projectRole(project: GradProject, profileId: number, userId: number): string {
  if (project.isOwner || project.ownerId === profileId) return "Project Owner";
  const member = project.members?.find(
    (m) => m.userId === userId || m.studentId === profileId,
  );
  if (member?.role === "leader") return "Team Lead";
  return "Team Member";
}

export type CompletionSuggestion = {
  done: boolean;
  text: string;
};

export function buildCompletionSuggestions(
  me: StudentMeResponse,
  strength: ProfileStrength,
  projectCount: number,
): CompletionSuggestion[] {
  const hasAcademic = Boolean(
    me.university?.trim() && me.major?.trim() && me.faculty?.trim() && me.gpa != null,
  );
  return [
    {
      done: strength.hasProfilePicture && strength.hasBio,
      text: "Profile photo and bio added",
    },
    { done: hasAcademic, text: "Academic information completed" },
    {
      done: strength.hasGeneralSkills && strength.hasMajorSkills,
      text: "Skills and tools listed",
    },
    { done: projectCount >= 2, text: "Add 2 more project case studies" },
    { done: Boolean(me.portfolio?.trim()), text: "Connect your personal website" },
    { done: false, text: "Add certifications or awards" },
  ];
}

export const WORK_PREFERENCE_LABELS = [
  "Preferred Team Size",
  "Work Style",
  "Leadership Preference",
  "Communication Style",
  "Weekly Availability",
  "Project Complexity",
] as const;

export const PORTFOLIO_LINK_DEFS = [
  { key: "github" as const, label: "GitHub" },
  { key: "linkedin" as const, label: "LinkedIn" },
  { key: "portfolio" as const, label: "Portfolio" },
  { key: "website" as const, label: "Personal Website" },
];
