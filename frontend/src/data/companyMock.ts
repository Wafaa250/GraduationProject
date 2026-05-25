export type Student = {
  id: string;
  name: string;
  university: string;
  year: string;
  specialization: string;
  skills: string[];
  partialSkills?: string[];
  interests: string[];
  availability: "Available" | "Limited" | "Busy";
  compatibility: number;
  role: string;
  bio: string;
  projects: { title: string; description: string }[];
  collaborationStyle: string;
  avatar?: string;
};

export type Team = {
  id: string;
  name: string;
  members: { name: string; role: string; avatar?: string }[];
  combinedSkills: string[];
  categories: string[];
  compatibility: number;
  strengths: string[];
  gaps: string[];
  availability: "Available" | "Limited" | "Busy";
  description: string;
  previousProjects: string[];
};

export type Collaboration = {
  id: string;
  request: string;
  participant: string;
  participantType: "Student" | "Team";
  status: "Pending" | "Accepted" | "Active" | "Completed";
  nextStep: string;
  startDate: string;
  compatibility: number;
  progress: number;
};

export const students: Student[] = [
  {
    id: "s1", name: "Lana Khaled", university: "Birzeit University", year: "4th year",
    specialization: "Software Engineering",
    skills: ["Flutter", "Dart", "Firebase", "UI/UX"], partialSkills: ["State Management"],
    interests: ["Mobile Apps", "EdTech", "Social Impact"], availability: "Available",
    compatibility: 96, role: "Flutter Lead",
    bio: "Mobile-first builder focused on accessible educational tools.",
    projects: [
      { title: "Tasleem", description: "Cross-platform learning companion for schools." },
      { title: "Beit Café", description: "Booking app for local coffee spots." },
    ],
    collaborationStyle: "Async-friendly, weekly syncs, design-driven.",
  },
  {
    id: "s2", name: "Omar Nasser", university: "An-Najah National University", year: "3rd year",
    specialization: "AI & Data Science",
    skills: ["Python", "PyTorch", "NLP", "Vector DBs"], interests: ["LLMs", "Research", "Healthcare AI"],
    availability: "Available", compatibility: 93, role: "AI Engineer",
    bio: "Research-leaning AI student exploring retrieval-augmented systems.",
    projects: [
      { title: "ArabicRAG", description: "Open-source RAG pipeline tuned for Arabic." },
    ],
    collaborationStyle: "Research-oriented, paper-aware, structured sprints.",
  },
  {
    id: "s3", name: "Sara Mansour", university: "Bethlehem University", year: "Graduating",
    specialization: "Design & HCI",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    interests: ["Service Design", "Accessibility", "Civic Tech"],
    availability: "Limited", compatibility: 91, role: "Product Designer",
    bio: "Designer connecting research, systems thinking and shipping.",
    projects: [{ title: "Mawjood", description: "Inclusive volunteering platform UI." }],
    collaborationStyle: "Workshop-driven, prototype early, iterate often.",
  },
  {
    id: "s4", name: "Hadi Daoud", university: "Palestine Polytechnic", year: "4th year",
    specialization: "Backend Engineering",
    skills: ["Node.js", "PostgreSQL", "Docker", "AWS"], partialSkills: ["Kubernetes"],
    interests: ["Distributed Systems", "Fintech"], availability: "Available",
    compatibility: 88, role: "Backend Engineer",
    bio: "Backend craftsman who enjoys API design and observability.",
    projects: [{ title: "Ledger.ps", description: "Lightweight bookkeeping API." }],
    collaborationStyle: "Spec-first, code reviews valued.",
  },
  {
    id: "s5", name: "Rania Saleh", university: "Birzeit University", year: "Masters",
    specialization: "Machine Learning",
    skills: ["TensorFlow", "MLOps", "Computer Vision"], interests: ["Agritech", "Edge AI"],
    availability: "Limited", compatibility: 90, role: "ML Engineer",
    bio: "CV researcher turning models into deployable products.",
    projects: [{ title: "OliveScan", description: "Olive leaf disease classifier." }],
    collaborationStyle: "Hypothesis-driven, metrics-led.",
  },
  {
    id: "s6", name: "Yousef Abu Rahma", university: "An-Najah", year: "3rd year",
    specialization: "Full-Stack",
    skills: ["React", "TypeScript", "Next.js", "Tailwind"], interests: ["SaaS", "DX Tooling"],
    availability: "Available", compatibility: 87, role: "Frontend Engineer",
    bio: "Frontend generalist with a soft spot for design systems.",
    projects: [{ title: "QudsBoard", description: "Realtime kanban for student clubs." }],
    collaborationStyle: "Fast iteration, opinionated, doc-first.",
  },
];

export const teams: Team[] = [
  {
    id: "t1", name: "Northstar Collective",
    members: [
      { name: "Lana Khaled", role: "Flutter Lead" },
      { name: "Sara Mansour", role: "Product Designer" },
      { name: "Hadi Daoud", role: "Backend" },
      { name: "Omar Nasser", role: "AI Engineer" },
    ],
    combinedSkills: ["Flutter", "Figma", "Node.js", "NLP", "Firebase", "PostgreSQL"],
    categories: ["MVP", "EdTech", "Mobile"], compatibility: 95,
    strengths: ["Shipped 3 MVPs together", "Strong design + AI mix", "Reliable async"],
    gaps: ["Limited DevOps depth"], availability: "Available",
    description: "Multidisciplinary team experienced in shipping mobile MVPs end to end.",
    previousProjects: ["Tasleem learning app", "Mawjood volunteering"],
  },
  {
    id: "t2", name: "AtlasLab",
    members: [
      { name: "Rania Saleh", role: "ML Lead" },
      { name: "Omar Nasser", role: "NLP" },
      { name: "Yousef Abu Rahma", role: "Frontend" },
    ],
    combinedSkills: ["TensorFlow", "PyTorch", "Next.js", "MLOps", "Vector DBs"],
    categories: ["AI", "Research", "Prototyping"], compatibility: 92,
    strengths: ["Research-grade AI", "Quick prototyping"], gaps: ["No dedicated designer"],
    availability: "Limited",
    description: "Applied AI squad focused on rapid model-to-product cycles.",
    previousProjects: ["OliveScan", "ArabicRAG"],
  },
  {
    id: "t3", name: "Studio Qamar",
    members: [
      { name: "Sara Mansour", role: "Design Lead" },
      { name: "Yousef Abu Rahma", role: "Frontend" },
      { name: "Hadi Daoud", role: "Backend" },
    ],
    combinedSkills: ["Figma", "React", "Node.js", "Design Systems", "Accessibility"],
    categories: ["Web", "Design", "Civic Tech"], compatibility: 89,
    strengths: ["Design-led delivery", "Strong accessibility"], gaps: ["Limited mobile native"],
    availability: "Available",
    description: "Design-engineering hybrid team building accessible web products.",
    previousProjects: ["QudsBoard", "Mawjood UI"],
  },
];

export const collaborations: Collaboration[] = [
  { id: "c1", request: "Flutter contributor for booking app", participant: "Lana Khaled",
    participantType: "Student", status: "Active", nextStep: "Weekly sync Thursday",
    startDate: "Apr 22", compatibility: 96, progress: 60 },
  { id: "c2", request: "EdTech MVP", participant: "Northstar Collective",
    participantType: "Team", status: "Accepted", nextStep: "Schedule kickoff",
    startDate: "May 02", compatibility: 95, progress: 20 },
  { id: "c3", request: "Arabic NLP prototype", participant: "Omar Nasser",
    participantType: "Student", status: "Pending", nextStep: "Awaiting response",
    startDate: "—", compatibility: 93, progress: 5 },
  { id: "c4", request: "Civic platform UI", participant: "Sara Mansour",
    participantType: "Student", status: "Completed", nextStep: "Share feedback",
    startDate: "Feb 10", compatibility: 91, progress: 100 },
];

export const conversations = [
  { id: "m1", with: "Lana Khaled", type: "Student" as const, request: "Booking app", lastMessage: "Sounds great — I'll prepare a short walkthrough.", time: "2m", unread: 1 },
  { id: "m2", with: "Northstar Collective", type: "Team" as const, request: "EdTech MVP", lastMessage: "Team is aligned. Proposing kickoff Tuesday.", time: "1h", unread: 0 },
  { id: "m3", with: "Omar Nasser", type: "Student" as const, request: "Arabic NLP", lastMessage: "Sharing a small benchmark today.", time: "3h", unread: 2 },
  { id: "m4", with: "Sara Mansour", type: "Student" as const, request: "Civic UI", lastMessage: "Final feedback shared 🙌", time: "1d", unread: 0 },
];
