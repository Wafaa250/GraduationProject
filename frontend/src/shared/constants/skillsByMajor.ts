export interface MajorSkillCatalog {
  roles: readonly string[]
  technicalSkills: readonly string[]
  tools: readonly string[]
}

const computerEngineering: MajorSkillCatalog = {
  roles: [
    'Backend Developer',
    'Frontend Developer',
    'Mobile Developer',
    'AI Engineer',
    'DevOps Engineer',
    'UI/UX Designer',
    'Database Engineer',
    'Full-Stack Developer',
    'Embedded Systems Engineer',
  ],
  technicalSkills: [
    'Java',
    'C#',
    'Python',
    'React',
    'ASP.NET',
    'SQL',
    'Machine Learning',
    'Networking',
    'Cyber Security',
    'Data Structures',
    'Object-Oriented Programming',
    'Cloud Computing',
  ],
  tools: [
    'Git',
    'GitHub',
    'Docker',
    'PostgreSQL',
    'MySQL',
    'Figma',
    'VS Code',
    'Postman',
    'Linux',
    'Azure',
  ],
}

const computerScience: MajorSkillCatalog = {
  roles: [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'AI Engineer',
    'Mobile Developer',
    'QA Engineer',
    'Research Assistant',
  ],
  technicalSkills: [
    'Python',
    'Java',
    'C++',
    'JavaScript',
    'Algorithms',
    'Machine Learning',
    'Data Structures',
    'Databases',
    'Computer Networks',
    'Operating Systems',
    'Software Engineering',
  ],
  tools: ['Git', 'GitHub', 'VS Code', 'Docker', 'PostgreSQL', 'Jupyter', 'Linux', 'Postman'],
}

const telecommunications: MajorSkillCatalog = {
  roles: [
    'Network Engineer',
    'RF Engineer',
    'Telecom Systems Engineer',
    'Embedded Developer',
    'IoT Engineer',
  ],
  technicalSkills: [
    'Networking',
    'Signal Processing',
    'Wireless Communications',
    'MATLAB',
    'C++',
    'Python',
    'Digital Systems',
    'Antenna Theory',
  ],
  tools: ['Wireshark', 'Git', 'MATLAB', 'Cisco Packet Tracer', 'Linux', 'VS Code'],
}

const electrical: MajorSkillCatalog = {
  roles: [
    'Electrical Engineer',
    'Control Systems Engineer',
    'Power Systems Engineer',
    'Embedded Engineer',
    'Automation Engineer',
  ],
  technicalSkills: [
    'Circuit Analysis',
    'Power Electronics',
    'Control Systems',
    'MATLAB',
    'C',
    'PLC Programming',
    'Signal Processing',
    'Renewable Energy',
  ],
  tools: ['MATLAB', 'Simulink', 'AutoCAD', 'Multisim', 'Git', 'LabVIEW'],
}

const civil: MajorSkillCatalog = {
  roles: [
    'Structural Engineer',
    'Site Engineer',
    'BIM Coordinator',
    'Project Engineer',
    'Quantity Surveyor',
  ],
  technicalSkills: [
    'Structural Analysis',
    'Concrete Design',
    'Steel Design',
    'Surveying',
    'Geotechnical Engineering',
    'Hydraulics',
    'Construction Management',
  ],
  tools: ['AutoCAD', 'Revit', 'SAP2000', 'ETABS', 'MS Project', 'Excel'],
}

const mechanical: MajorSkillCatalog = {
  roles: [
    'Mechanical Design Engineer',
    'Manufacturing Engineer',
    'HVAC Engineer',
    'Maintenance Engineer',
    'R&D Engineer',
  ],
  technicalSkills: [
    'Thermodynamics',
    'Fluid Mechanics',
    'Machine Design',
    'CAD Modeling',
    'Materials Science',
    'Manufacturing Processes',
    'Finite Element Analysis',
  ],
  tools: ['SolidWorks', 'AutoCAD', 'ANSYS', 'MATLAB', 'Excel', 'Git'],
}

const industrial: MajorSkillCatalog = {
  roles: [
    'Industrial Engineer',
    'Operations Analyst',
    'Quality Engineer',
    'Supply Chain Analyst',
    'Process Improvement Specialist',
  ],
  technicalSkills: [
    'Operations Research',
    'Quality Management',
    'Lean Manufacturing',
    'Six Sigma',
    'Simulation',
    'Statistics',
    'Production Planning',
  ],
  tools: ['Excel', 'Minitab', 'Arena Simulation', 'Power BI', 'AutoCAD', 'MS Project'],
}

const architectural: MajorSkillCatalog = {
  roles: [
    'Architectural Designer',
    'BIM Architect',
    'Interior Coordinator',
    'Urban Design Assistant',
    'Visualization Specialist',
  ],
  technicalSkills: [
    'Architectural Design',
    'Building Codes',
    '3D Modeling',
    'Space Planning',
    'Sustainable Design',
    'Construction Documentation',
  ],
  tools: ['Revit', 'AutoCAD', 'SketchUp', 'Rhino', 'Lumion', 'Photoshop'],
}

const mechatronics: MajorSkillCatalog = {
  roles: [
    'Mechatronics Engineer',
    'Robotics Engineer',
    'Automation Engineer',
    'Embedded Developer',
    'Control Engineer',
  ],
  technicalSkills: [
    'Robotics',
    'Control Systems',
    'Embedded Systems',
    'C++',
    'Python',
    'PLC Programming',
    'Sensors & Actuators',
    'Machine Vision',
  ],
  tools: ['Arduino', 'Raspberry Pi', 'MATLAB', 'SolidWorks', 'Git', 'ROS', 'VS Code'],
}

const medicine: MajorSkillCatalog = {
  roles: [
    'Clinical Research Assistant',
    'Medical Intern',
    'Community Health Volunteer',
    'Lab Assistant',
    'Patient Education Coordinator',
  ],
  technicalSkills: [
    'Clinical Skills',
    'Anatomy',
    'Pharmacology',
    'Medical Ethics',
    'Patient Communication',
    'Evidence-Based Medicine',
    'Public Health Basics',
  ],
  tools: ['Electronic Health Records', 'SPSS', 'Medical Databases', 'Excel', 'Presentation Tools'],
}

const nursing: MajorSkillCatalog = {
  roles: [
    'Clinical Nurse',
    'Community Nurse',
    'Patient Care Coordinator',
    'Health Educator',
  ],
  technicalSkills: [
    'Patient Care',
    'Clinical Assessment',
    'Nursing Ethics',
    'Emergency Care',
    'Health Promotion',
    'Communication Skills',
  ],
  tools: ['EHR Systems', 'Excel', 'Simulation Labs'],
}

const scienceMath: MajorSkillCatalog = {
  roles: [
    'Research Assistant',
    'Lab Technician',
    'Data Analyst',
    'Teaching Assistant',
    'STEM Tutor',
  ],
  technicalSkills: [
    'Mathematics',
    'Statistics',
    'Scientific Writing',
    'Laboratory Techniques',
    'Research Methods',
    'Data Analysis',
  ],
  tools: ['MATLAB', 'Python', 'LaTeX', 'Excel', 'SPSS', 'Jupyter'],
}

const humanitiesMedia: MajorSkillCatalog = {
  roles: [
    'Content Writer',
    'Editor',
    'Research Assistant',
    'Translator',
    'Media Producer',
    'Community Manager',
  ],
  technicalSkills: [
    'Writing',
    'Editing',
    'Critical Analysis',
    'Translation',
    'Journalism',
    'Public Speaking',
    'Digital Content',
  ],
  tools: ['Microsoft Office', 'Adobe Premiere', 'Canva', 'WordPress', 'Google Workspace'],
}

const education: MajorSkillCatalog = {
  roles: [
    'Classroom Teacher',
    'Teaching Assistant',
    'Curriculum Developer',
    'Educational Mentor',
    'Special Education Support',
  ],
  technicalSkills: [
    'Lesson Planning',
    'Classroom Management',
    'Educational Psychology',
    'Assessment Design',
    'Inclusive Education',
    'Communication Skills',
  ],
  tools: ['Learning Management Systems', 'Google Classroom', 'PowerPoint', 'Canva'],
}

const business: MajorSkillCatalog = {
  roles: [
    'Business Analyst',
    'Marketing Assistant',
    'Finance Intern',
    'Entrepreneur',
    'Project Coordinator',
    'HR Assistant',
  ],
  technicalSkills: [
    'Accounting',
    'Finance',
    'Marketing',
    'Economics',
    'Business Communication',
    'Data Analysis',
    'Management',
  ],
  tools: ['Excel', 'Power BI', 'SPSS', 'QuickBooks', 'Microsoft Office', 'Canva'],
}

const law: MajorSkillCatalog = {
  roles: [
    'Legal Research Assistant',
    'Paralegal Intern',
    'Policy Analyst',
    'Mediator Assistant',
  ],
  technicalSkills: [
    'Legal Research',
    'Legal Writing',
    'Constitutional Law',
    'Civil Law',
    'Criminal Law',
    'Negotiation',
    'Critical Thinking',
  ],
  tools: ['Legal Databases', 'Microsoft Office', 'Reference Management Tools'],
}

const fineArts: MajorSkillCatalog = {
  roles: [
    'Graphic Designer',
    'UI/UX Designer',
    'Illustrator',
    'Interior Designer',
    'Visual Artist',
    'Motion Designer',
  ],
  technicalSkills: [
    'Visual Design',
    'Typography',
    'Color Theory',
    'Illustration',
    'Branding',
    'Layout Design',
    'User Experience',
  ],
  tools: ['Figma', 'Adobe Photoshop', 'Illustrator', 'InDesign', 'Procreate', 'Blender'],
}

const pharmacy: MajorSkillCatalog = {
  roles: [
    'Pharmacy Intern',
    'Clinical Pharmacy Assistant',
    'Lab Assistant',
    'Community Pharmacy Staff',
  ],
  technicalSkills: [
    'Pharmacology',
    'Pharmaceutical Chemistry',
    'Patient Counseling',
    'Drug Interactions',
    'Dosage Calculations',
    'Quality Control',
  ],
  tools: ['Pharmacy Software', 'Excel', 'Scientific Databases'],
}

const agriculture: MajorSkillCatalog = {
  roles: [
    'Agricultural Technician',
    'Field Research Assistant',
    'Farm Management Assistant',
    'Food Quality Assistant',
    'Veterinary Assistant',
  ],
  technicalSkills: [
    'Crop Science',
    'Soil Science',
    'Animal Husbandry',
    'Food Safety',
    'Sustainable Agriculture',
    'Irrigation Systems',
  ],
  tools: ['GIS Tools', 'Excel', 'SPSS', 'Field Data Collection Apps'],
}

const sharia: MajorSkillCatalog = {
  roles: [
    'Research Assistant',
    'Teaching Assistant',
    'Community Educator',
    'Islamic Studies Tutor',
  ],
  technicalSkills: [
    'Islamic Jurisprudence',
    'Quranic Studies',
    'Hadith Studies',
    'Arabic Language',
    'Fiqh',
    'Theology',
    'Research Methods',
  ],
  tools: ['Reference Libraries', 'Microsoft Office', 'Arabic Typing Tools'],
}

const dentistry: MajorSkillCatalog = {
  roles: [
    'Dental Intern',
    'Clinical Assistant',
    'Oral Health Educator',
    'Lab Assistant',
  ],
  technicalSkills: [
    'Oral Anatomy',
    'Dental Procedures',
    'Radiography',
    'Patient Care',
    'Infection Control',
    'Preventive Dentistry',
  ],
  tools: ['Dental Imaging Software', 'EHR', 'Simulation Labs'],
}

/** Curated skill suggestions per major — expand over time. */
export const SKILLS_BY_MAJOR: Record<string, MajorSkillCatalog> = {
  'Computer Engineering': computerEngineering,
  'Computer Science': computerScience,
  'Telecommunications Engineering': telecommunications,
  'Electrical Engineering': electrical,
  'Civil Engineering': civil,
  'Mechanical Engineering': mechanical,
  'Industrial Engineering': industrial,
  'Architectural Engineering': architectural,
  'Surveying Engineering': civil,
  'Mechatronics Engineering': mechatronics,

  Medicine: medicine,
  'Medical Laboratory Sciences': medicine,
  Nursing: nursing,
  Physiotherapy: medicine,
  Radiology: medicine,
  'Public Health': medicine,

  Mathematics: scienceMath,
  Physics: scienceMath,
  Chemistry: scienceMath,
  Biology: scienceMath,
  Biotechnology: scienceMath,
  'Earth and Environmental Sciences': scienceMath,

  'Arabic Language and Literature': humanitiesMedia,
  'English Language and Literature': humanitiesMedia,
  History: humanitiesMedia,
  Geography: humanitiesMedia,
  'Media and Journalism': humanitiesMedia,
  Translation: humanitiesMedia,

  'Classroom Teacher': education,
  'Educational Technology': education,
  'Special Education': education,
  'Kindergarten Education': education,
  'Physical Education': education,

  Law: law,

  'Business Administration': business,
  Accounting: business,
  'Finance and Banking': business,
  Economics: business,
  'Political Science': humanitiesMedia,
  'Social Work': humanitiesMedia,

  'Graphic Design': fineArts,
  'Interior Design': fineArts,
  'Visual Arts': fineArts,
  Music: fineArts,

  Pharmacy: pharmacy,
  'Pharmaceutical Sciences': pharmacy,

  'Agricultural Sciences': agriculture,
  'Food Science and Technology': agriculture,
  'Veterinary Medicine': agriculture,

  'Sharia and Islamic Studies': sharia,
  'Fundamentals of Religion': sharia,

  Dentistry: dentistry,
  'Oral and Dental Medicine': dentistry,
}

const FALLBACK_CATALOG: MajorSkillCatalog = {
  roles: ['Team Member', 'Research Assistant', 'Project Contributor', 'Intern'],
  technicalSkills: [
    'Communication',
    'Problem Solving',
    'Teamwork',
    'Research Methods',
    'Critical Thinking',
  ],
  tools: ['Microsoft Office', 'Google Workspace', 'Excel', 'Presentation Tools'],
}

export function getSkillsForMajor(major: string): MajorSkillCatalog {
  return SKILLS_BY_MAJOR[major] ?? FALLBACK_CATALOG
}
