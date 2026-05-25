import type { RecommendationCandidate } from "@/types/companyRecommendation";

/** Static pool for UI preview only — replaced by matching API later. */
const CANDIDATE_POOL: RecommendationCandidate[] = [
  {
    id: "rec-1",
    name: "Lana Khaled",
    university: "Birzeit University",
    year: "4th year",
    major: "Software Engineering",
    matchScore: 96,
    matchingSkills: ["Flutter", "Firebase", "UI/UX"],
    insights: [
      "Relevant mobile project experience",
      "Strong matching skills",
      "Similar project interests",
      "Available for collaboration",
    ],
    availability: "Available",
    bio: "Mobile-first builder focused on accessible educational tools and cross-platform delivery.",
    skills: ["Flutter", "Dart", "Firebase", "UI/UX", "Prototyping"],
    tools: ["Figma", "Git", "Firebase Console"],
    projectInterests: ["Mobile Apps", "EdTech", "Social Impact"],
  },
  {
    id: "rec-2",
    name: "Omar Nasser",
    university: "An-Najah National University",
    year: "3rd year",
    major: "AI & Data Science",
    matchScore: 93,
    matchingSkills: ["Python", "Research", "Data Analysis"],
    insights: [
      "Research-oriented portfolio",
      "Strong matching skills",
      "Experience with structured deliverables",
      "Open to hybrid collaboration",
    ],
    availability: "Available",
    bio: "Research-leaning student exploring retrieval-augmented systems and applied NLP.",
    skills: ["Python", "PyTorch", "NLP", "Data Analysis", "Statistics"],
    tools: ["Jupyter", "Hugging Face", "PostgreSQL"],
    projectInterests: ["LLMs", "Healthcare AI", "Research"],
  },
  {
    id: "rec-3",
    name: "Sara Mansour",
    university: "Bethlehem University",
    year: "Graduating",
    major: "Design & HCI",
    matchScore: 91,
    matchingSkills: ["Figma", "Research", "Project Management"],
    insights: [
      "Design-led collaboration style",
      "Strong matching skills",
      "Civic and service-design interests",
      "Limited availability — plan early",
    ],
    availability: "Limited",
    bio: "Designer connecting user research, systems thinking, and shipping polished interfaces.",
    skills: ["Figma", "User Research", "Prototyping", "Accessibility"],
    tools: ["Figma", "Miro", "Notion"],
    projectInterests: ["Service Design", "Civic Tech", "Accessibility"],
  },
  {
    id: "rec-4",
    name: "Hadi Daoud",
    university: "Palestine Polytechnic University",
    year: "4th year",
    major: "Backend Engineering",
    matchScore: 88,
    matchingSkills: ["Node.js", "PostgreSQL", "Project Management"],
    insights: [
      "API and data modeling experience",
      "Strong matching skills",
      "Spec-first collaboration",
      "Available for collaboration",
    ],
    availability: "Available",
    bio: "Backend craftsman who enjoys API design, observability, and reliable delivery.",
    skills: ["Node.js", "PostgreSQL", "Docker", "REST APIs"],
    tools: ["Postman", "Docker", "GitHub Actions"],
    projectInterests: ["Fintech", "Distributed Systems", "SaaS"],
  },
  {
    id: "rec-5",
    name: "Nour Al-Qadi",
    university: "Hebron University",
    year: "3rd year",
    major: "Accounting & Finance",
    matchScore: 90,
    matchingSkills: ["Accounting", "Excel", "Research"],
    insights: [
      "Strong analytical background",
      "Relevant coursework projects",
      "Detail-oriented reporting",
      "Available for collaboration",
    ],
    availability: "Available",
    bio: "Finance student with experience in budgeting models, audits, and startup financial planning.",
    skills: ["Accounting", "Financial Modeling", "Excel", "Reporting"],
    tools: ["Excel", "QuickBooks", "Power BI"],
    projectInterests: ["Startups", "Impact Ventures", "SME Support"],
  },
  {
    id: "rec-6",
    name: "Karim Saleh",
    university: "Birzeit University",
    year: "4th year",
    major: "Civil Engineering",
    matchScore: 87,
    matchingSkills: ["AutoCAD", "Project Management", "Research"],
    insights: [
      "Technical documentation experience",
      "Strong matching skills",
      "Site planning and modeling background",
      "Available for collaboration",
    ],
    availability: "Available",
    bio: "Civil engineering student focused on infrastructure planning and BIM-ready deliverables.",
    skills: ["AutoCAD", "Structural Basics", "Surveying", "Technical Writing"],
    tools: ["AutoCAD", "Revit", "MS Project"],
    projectInterests: ["Infrastructure", "Sustainability", "Urban Planning"],
  },
  {
    id: "rec-7",
    name: "Maya Haddad",
    university: "An-Najah National University",
    year: "2nd year",
    major: "Marketing & Communications",
    matchScore: 85,
    matchingSkills: ["Marketing", "Research", "Figma"],
    insights: [
      "Campaign and content experience",
      "Strong matching skills",
      "Similar project interests",
      "Available for collaboration",
    ],
    availability: "Available",
    bio: "Marketing student passionate about brand storytelling, user research, and growth experiments.",
    skills: ["Marketing", "Content Strategy", "Social Media", "Copywriting"],
    tools: ["Canva", "Google Analytics", "Notion"],
    projectInterests: ["Brand Building", "EdTech", "Community Growth"],
  },
  {
    id: "rec-8",
    name: "Yousef Abu Rahma",
    university: "An-Najah National University",
    year: "3rd year",
    major: "Computer Science",
    matchScore: 87,
    matchingSkills: ["React", "TypeScript", "Project Management"],
    insights: [
      "Full-stack web delivery",
      "Strong matching skills",
      "Fast iteration style",
      "Available for collaboration",
    ],
    availability: "Available",
    bio: "Frontend generalist with a focus on design systems and polished product surfaces.",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    tools: ["VS Code", "Git", "Vercel"],
    projectInterests: ["SaaS", "Developer Tools", "Web Apps"],
  },
];

function normalizeSkill(s: string): string {
  return s.trim().toLowerCase();
}

function overlapScore(candidate: RecommendationCandidate, requestSkills: string[]): number {
  if (requestSkills.length === 0) return candidate.matchScore;
  const req = new Set(requestSkills.map(normalizeSkill));
  const matched = candidate.skills.filter((s) => req.has(normalizeSkill(s))).length;
  const partial = candidate.matchingSkills.filter((s) => req.has(normalizeSkill(s))).length;
  return matched * 12 + partial * 8 + candidate.matchScore * 0.35;
}

/** Rank placeholder candidates against request skills (UI-only until matching API exists). */
export function buildPlaceholderRecommendations(
  requestSkills: string[],
  limit = 6,
): RecommendationCandidate[] {
  const ranked = [...CANDIDATE_POOL].sort(
    (a, b) => overlapScore(b, requestSkills) - overlapScore(a, requestSkills),
  );
  return ranked.slice(0, limit).map((c, i) => {
    const skills =
      requestSkills.length > 0
        ? c.matchingSkills.filter((s) =>
            requestSkills.some((r) => normalizeSkill(r) === normalizeSkill(s)),
          )
        : c.matchingSkills;
    const matchingSkills =
      skills.length > 0 ? skills : c.matchingSkills.slice(0, 4);
    const score = Math.min(98, Math.max(82, c.matchScore - i * 2));
    return { ...c, matchScore: score, matchingSkills };
  });
}
