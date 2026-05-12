/** Skill pool metadata for Edit Profile (mirrors web EditProfilePage). */

export type SkillCategory = "tech" | "engineering" | "medical" | "science";

export const FACULTY_CATEGORY: Record<string, SkillCategory> = {
  "Engineering and Information Technology": "engineering",
  "Information Technology": "tech",
  Science: "science",
  "Medicine and Health Sciences": "medical",
  Pharmacy: "medical",
  Nursing: "medical",
  "Agriculture and Veterinary Medicine": "science",
};

export const SKILLS_DATA: Record<
  SkillCategory,
  { roles: string[]; technicalSkills: string[]; tools: string[] }
> = {
  tech: {
    roles: [
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "Mobile App Developer",
      "AI Engineer",
      "Data Scientist",
      "Cybersecurity Specialist",
      "DevOps Engineer",
      "QA Tester",
      "UI/UX Designer",
      "Game Developer",
    ],
    technicalSkills: [
      "Web Development",
      "API Development",
      "Software Architecture",
      "Machine Learning",
      "Data Analysis",
      "Cloud Systems",
      "Network Security",
      "Software Testing",
      "Database Design",
      "System Integration",
    ],
    tools: [
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C++",
      "C#",
      "PHP",
      "Go",
      "Kotlin",
      "Swift",
      "Dart",
      "R",
      "MATLAB",
      "React",
      "Angular",
      "Vue",
      "Node.js",
      "ASP.NET",
      "Spring Boot",
      "Django",
      "Flutter",
      "TensorFlow",
      "PyTorch",
      "Docker",
      "Git",
    ],
  },
  engineering: {
    roles: [
      "Mechanical Engineer",
      "Electrical Engineer",
      "Civil Engineer",
      "Mechatronics Engineer",
      "Energy Engineer",
      "Industrial Engineer",
    ],
    technicalSkills: [
      "Mechanical Design",
      "Structural Analysis",
      "Control Systems",
      "Power Systems",
      "Manufacturing Processes",
      "Engineering Modeling",
      "Project Engineering",
      "Automation Systems",
      "Robotics Systems",
      "Energy Systems",
    ],
    tools: ["AutoCAD", "SolidWorks", "MATLAB", "ANSYS", "PLC Programming", "Arduino", "LabVIEW"],
  },
  medical: {
    roles: [
      "Medical Doctor",
      "Clinical Specialist",
      "Health Information Specialist",
      "Medical Data Analyst",
      "Clinical Researcher",
      "Healthcare Administrator",
    ],
    technicalSkills: [
      "Clinical Assessment",
      "Patient Care",
      "Medical Diagnostics",
      "Health Data Analysis",
      "Medical Documentation",
      "Clinical Research",
      "Healthcare Analytics",
      "Medical Statistics",
      "Healthcare Information Systems",
    ],
    tools: [
      "Electronic Health Records (EHR)",
      "Hospital Information Systems",
      "Medical Coding Systems",
      "Healthcare Databases",
      "Clinical Data Systems",
    ],
  },
  science: {
    roles: [
      "Research Scientist",
      "Data Analyst",
      "Lab Specialist",
      "Biotechnology Researcher",
      "Environmental Scientist",
      "Statistician",
    ],
    technicalSkills: [
      "Scientific Research",
      "Statistical Analysis",
      "Data Modeling",
      "Laboratory Analysis",
      "Scientific Writing",
      "Experimental Design",
    ],
    tools: ["SPSS", "MATLAB", "R", "Python", "Laboratory Equipment", "Data Visualization Tools"],
  },
};

const ALL_ROLES = [...new Set(Object.values(SKILLS_DATA).flatMap((d) => d.roles))];
const ALL_TECH_SKILLS = [...new Set(Object.values(SKILLS_DATA).flatMap((d) => d.technicalSkills))];
const ALL_TOOLS_LIST = [...new Set(Object.values(SKILLS_DATA).flatMap((d) => d.tools))];

export function poolsForFaculty(faculty: string | undefined): {
  rolesPool: string[];
  techPool: string[];
  toolsPool: string[];
} {
  const category = faculty ? FACULTY_CATEGORY[faculty] : undefined;
  const skillsPool = category ? SKILLS_DATA[category] : null;
  return {
    rolesPool: skillsPool?.roles ?? ALL_ROLES,
    techPool: skillsPool?.technicalSkills ?? ALL_TECH_SKILLS,
    toolsPool: skillsPool?.tools ?? ALL_TOOLS_LIST,
  };
}

export const AVAILABILITY_OPTIONS = [
  "Less than 5 hours/week",
  "5–10 hours/week",
  "10–20 hours/week",
  "20+ hours/week",
  "Full-time",
];

export const LOOKING_FOR_OPTIONS = [
  "Graduation Project Team",
  "Study Group",
  "Hackathon Team",
  "Internship Partner",
  "Open to anything",
];

export const ALL_LANGUAGES = ["Arabic", "English", "French", "German", "Spanish", "Chinese", "Other"];
