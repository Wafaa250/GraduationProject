import {
  ALL_ROLES,
  ALL_TECH_SKILLS,
  ALL_TOOLS_LIST,
  SKILLS_DATA,
} from "@/constants/studentSkillPools";

export const PROJECT_CATEGORIES = [
  "Software & Technology",
  "AI & Machine Learning",
  "Web & Mobile Applications",
  "Data Science & Analytics",
  "Cyber Security & Networking",
  "Engineering & Construction",
  "Architecture & Built Environment",
  "Business & Finance",
  "Marketing & Communications",
  "Healthcare & Life Sciences",
  "Education & Training",
  "Law & Public Policy",
  "Media & Journalism",
  "Design & Creative Arts",
  "Agriculture & Environment",
  "Research & Innovation",
  "Other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

const CROSS_SECTOR_ROLES = [
  "Flutter Developer",
  "Mobile Developer",
  "Architect",
  "Financial Analyst",
  "Marketing Specialist",
  "Business Analyst",
  "Accountant",
  "Economist",
  "Journalist",
  "Content Writer",
  "Pharmacist",
  "Clinical Research Assistant",
  "Nurse",
  "Medical Doctor",
  "Legal Consultant",
  "Translator",
  "Graphic Designer",
  "UX Researcher",
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Environmental Scientist",
  "Teacher / Trainer",
  "Agricultural Specialist",
];

const ALL_POOL_SKILLS = [
  ...new Set(Object.values(SKILLS_DATA).flatMap((p) => [...p.technicalSkills, ...p.tools])),
];

const CROSS_SECTOR_SKILLS = [
  "Financial Analysis",
  "Market Research",
  "Project Management",
  "Data Analysis",
  "Scientific Writing",
  "Clinical Research",
  "Legal Research",
  "Translation",
  "Content Strategy",
  "Brand Design",
  "User Research",
  "Statistical Analysis",
  "Laboratory Analysis",
  "Flutter",
  "ASP.NET Core",
  "PostgreSQL",
  "Figma",
];

export const COMPANY_ROLE_OPTIONS = [...new Set([...ALL_ROLES, ...CROSS_SECTOR_ROLES])].sort((a, b) =>
  a.localeCompare(b),
);

export const COMPANY_SKILL_OPTIONS = [
  ...new Set([
    ...CROSS_SECTOR_SKILLS,
    ...ALL_POOL_SKILLS,
    ...ALL_TOOLS_LIST,
    ...ALL_TECH_SKILLS,
  ]),
].sort((a, b) => a.localeCompare(b));

export const DURATION_UNITS = ["Days", "Weeks", "Months", "Semesters", "Years"] as const;

export type DurationUnit = (typeof DURATION_UNITS)[number];

export const COLLABORATION_FORMATS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on-site", label: "On-site" },
  { value: "flexible", label: "Flexible" },
] as const;

export const CUSTOM_ENTRY_MAX = 80;

export function normalizeCustomEntry(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t || t.length > CUSTOM_ENTRY_MAX) return null;
  return t;
}

export function resolveProjectCategory(selected: string, customOther: string): string {
  if (selected === "Other") {
    return normalizeCustomEntry(customOther) ?? "";
  }
  return selected;
}

export function buildDurationLabel(
  ongoing: boolean,
  value: number | "",
  unit: DurationUnit | "",
): string {
  if (ongoing) return "Ongoing collaboration";
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!n || n < 1 || !unit) return "";
  const label = n === 1 ? unit.replace(/s$/, "") : unit;
  return `${n} ${label}`;
}

export const WIZARD_STEPS = [
  "Request Type",
  "Project basics",
  "Roles & skills",
  "Scope",
  "Review",
] as const;
