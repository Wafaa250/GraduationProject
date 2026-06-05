export const UNIVERSITIES = ["An-Najah National University (NNU)"] as const;

export const UNIVERSITY_FACULTIES: Record<string, string[]> = {
  "An-Najah National University (NNU)": [
    "Engineering and Information Technology",
    "Information Technology",
    "Science",
    "Medicine and Health Sciences",
    "Pharmacy",
    "Nursing",
    "Agriculture and Veterinary Medicine",
  ],
};

export const MAJORS: Record<string, string[]> = {
  "Engineering and Information Technology": [
    "Computer Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Industrial Engineering",
    "Architectural Engineering",
    "Mechatronics Engineering",
    "Communication Engineering",
    "Energy and Renewable Energy Engineering",
  ],
  "Information Technology": [
    "Computer Science",
    "Information Technology",
    "Software Engineering",
    "Artificial Intelligence",
    "Data Science",
    "Cyber Security",
    "Network Systems",
  ],
  Science: [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Biotechnology",
    "Statistics",
    "Environmental Sciences",
  ],
  "Medicine and Health Sciences": [
    "Medicine",
    "Health Information Management",
    "Medical Imaging",
    "Clinical Nutrition",
    "Physical Therapy",
    "Anesthesia and Resuscitation Technology",
    "Medical Laboratory Sciences",
    "Optometry",
  ],
  Pharmacy: ["Pharmacy", "Doctor of Pharmacy (PharmD)"],
  Nursing: ["Nursing"],
  "Agriculture and Veterinary Medicine": [
    "Agriculture",
    "Plant Production and Protection",
    "Animal Production",
    "Food Science and Technology",
    "Veterinary Medicine",
  ],
};

export const ACADEMIC_YEARS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
] as const;

export const DOCTOR_SPECIALIZATIONS = [
  "Computer Science",
  "Software Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Cyber Security",
  "Web Development",
  "Mobile Development",
  "Computer Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Medicine",
  "Pharmacy",
  "Health Informatics",
  "Nursing",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Statistics",
  "Business Administration",
  "Finance",
  "Marketing",
  "Economics",
  "Law",
  "Education",
  "Architecture",
  "Environmental Science",
] as const;

export const ASSOCIATION_FACULTIES = [
  "Engineering and Information Technology",
  "Information Technology",
  "Science",
  "Medicine and Health Sciences",
  "Pharmacy",
  "Nursing",
  "Agriculture and Veterinary Medicine",
] as const;
