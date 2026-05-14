/** Shared skill pools for student registration & profile (kept in sync with mobile `editProfilePools`). */

export type SkillCategory = 'tech' | 'engineering' | 'medical' | 'science'

export const FACULTY_CATEGORY: Record<string, SkillCategory> = {
  'Engineering and Information Technology': 'engineering',
  'Information Technology': 'tech',
  Science: 'science',
  'Medicine and Health Sciences': 'medical',
  Pharmacy: 'medical',
  Nursing: 'medical',
  'Agriculture and Veterinary Medicine': 'science',
}

/** Clinical-adjacent majors that benefit from the tech stack (systems, data, imaging software). */
const MEDICAL_MAJORS_USE_TECH = new Set(['Health Information Management', 'Medical Imaging'])

/** Science majors that align better with the tech skill pool (data / computing). */
const SCIENCE_MAJORS_USE_TECH = new Set(['Statistics'])

export const CUSTOM_SKILL_MAX_LENGTH = 80

/** Trim and validate a user-typed skill; returns null if invalid. */
export function normalizeCustomSkill(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, ' ')
  if (!t || t.length > CUSTOM_SKILL_MAX_LENGTH) return null
  return t
}

/** Values the user selected that are not in the predefined chip list (custom / legacy). */
export function customSelections(selected: string[], pool: string[]): string[] {
  return selected.filter((x) => !pool.includes(x))
}

export type SkillPack = { roles: string[]; technicalSkills: string[]; tools: string[] }

export const SKILLS_DATA: Record<SkillCategory, { roles: string[]; technicalSkills: string[]; tools: string[] }> = {
  tech: {
    roles: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile App Developer',
      'Embedded Systems Engineer',
      'Firmware Developer',
      'AI Engineer',
      'Data Scientist',
      'Cybersecurity Specialist',
      'DevOps Engineer',
      'QA Tester',
      'UI/UX Designer',
      'Game Developer',
    ],
    technicalSkills: [
      'Web Development',
      'API Development',
      'Software Architecture',
      'Embedded Systems',
      'Digital Logic & FPGA',
      'Computer Architecture',
      'Operating Systems',
      'Machine Learning',
      'Data Analysis',
      'Cloud Systems',
      'Network Security',
      'Software Testing',
      'Database Design',
      'System Integration',
    ],
    tools: [
      'JavaScript',
      'TypeScript',
      'Python',
      'Java',
      'C',
      'C++',
      'C#',
      'Go',
      'Rust',
      'Verilog / VHDL',
      'MATLAB',
      'React',
      'Node.js',
      'Docker',
      'Git',
      'Linux',
      'STM32 / ARM',
    ],
  },
  engineering: {
    roles: [
      'Mechanical Engineer',
      'Electrical Engineer',
      'Civil Engineer',
      'Mechatronics Engineer',
      'Energy Engineer',
      'Industrial Engineer',
    ],
    technicalSkills: [
      'Mechanical Design',
      'Structural Analysis',
      'Control Systems',
      'Power Systems',
      'Manufacturing Processes',
      'Engineering Modeling',
      'Project Engineering',
      'Automation Systems',
      'Robotics Systems',
      'Energy Systems',
    ],
    tools: ['AutoCAD', 'SolidWorks', 'MATLAB', 'ANSYS', 'PLC Programming', 'Arduino', 'LabVIEW'],
  },
  medical: {
    roles: [
      'Medical Doctor',
      'Clinical Specialist',
      'Health Information Specialist',
      'Medical Data Analyst',
      'Clinical Researcher',
      'Healthcare Administrator',
    ],
    technicalSkills: [
      'Clinical Assessment',
      'Patient Care',
      'Medical Diagnostics',
      'Health Data Analysis',
      'Medical Documentation',
      'Clinical Research',
      'Healthcare Analytics',
      'Medical Statistics',
      'Healthcare Information Systems',
    ],
    tools: [
      'Electronic Health Records (EHR)',
      'Hospital Information Systems',
      'Medical Coding Systems',
      'Healthcare Databases',
      'Clinical Data Systems',
    ],
  },
  science: {
    roles: [
      'Research Scientist',
      'Data Analyst',
      'Lab Specialist',
      'Biotechnology Researcher',
      'Environmental Scientist',
      'Statistician',
    ],
    technicalSkills: [
      'Scientific Research',
      'Statistical Analysis',
      'Data Modeling',
      'Laboratory Analysis',
      'Scientific Writing',
      'Experimental Design',
    ],
    tools: ['SPSS', 'MATLAB', 'R', 'Python', 'Laboratory Equipment', 'Data Visualization Tools'],
  },
}

/** Per-major skill chips for Engineering & IT (names must match registration major strings). */
export const ENGINEERING_MAJOR_PACKS: Record<string, SkillPack> = {
  'Computer Engineering': SKILLS_DATA.tech,
  'Communication Engineering': {
    roles: [
      'RF / Wireless Engineer',
      'Telecommunications Engineer',
      'Network Engineer',
      'DSP Engineer',
      'Antenna & Propagation Specialist',
      'Field Test Engineer',
      'Embedded Communications Developer',
      '5G / Cellular Systems Engineer',
    ],
    technicalSkills: [
      'Wireless & Mobile Communications',
      'Digital Signal Processing (DSP)',
      'RF Circuit & System Design',
      'Antenna Theory & Design',
      'Information Theory & Coding',
      'Optical Fiber Communications',
      'Network Protocols & Performance',
      'Software-Defined Radio concepts',
      'Channel Modeling & Simulation',
    ],
    tools: ['MATLAB', 'Python', 'GNU Radio', 'LabVIEW', 'CST Studio Suite', 'ADS', 'Wireshark', 'NS-3 / simulation'],
  },
  'Electrical Engineering': {
    roles: [
      'Power Systems Engineer',
      'Protection & Control Engineer',
      'Power Electronics Engineer',
      'Electric Machines Specialist',
      'Control Systems Engineer',
      'Electronics Design Engineer',
    ],
    technicalSkills: [
      'Power System Analysis & Stability',
      'High / Medium Voltage Design',
      'Power Electronics & Drives',
      'Electric Machines & Transformers',
      'Protective Relaying & Grid Codes',
      'Analog & Digital Circuit Design',
      'Classical & Modern Control',
      'Renewable Integration (grid side)',
    ],
    tools: ['MATLAB / Simulink', 'ETAP / SKM', 'PSCAD', 'PSIM', 'SPICE', 'Altium / KiCad', 'LabVIEW'],
  },
  'Mechanical Engineering': {
    roles: [
      'Mechanical Design Engineer',
      'HVAC / Thermal Engineer',
      'CAE / FEA Analyst',
      'Manufacturing & Process Engineer',
      'R&D Mechanical Engineer',
    ],
    technicalSkills: [
      'Solid Mechanics & Machine Design',
      'Thermodynamics & Heat Transfer',
      'Fluid Mechanics',
      'Materials Selection',
      'CAD & Drafting',
      'FEA & Structural Simulation',
      'Manufacturing Processes',
      'Mechanical Measurements & Testing',
    ],
    tools: ['SolidWorks', 'Inventor', 'AutoCAD', 'ANSYS Mechanical', 'MATLAB', 'CAM (e.g. Mastercam)', 'CFD basics'],
  },
  'Civil Engineering': {
    roles: [
      'Structural Engineer',
      'Geotechnical Engineer',
      'Transportation Engineer',
      'Hydraulics / Water Resources Engineer',
      'Site & Construction Engineer',
      'BIM / Civil Coordinator',
    ],
    technicalSkills: [
      'Structural Analysis & Design',
      'Reinforced Concrete & Steel',
      'Geotechnical Investigation & Foundations',
      'Hydraulics & Hydrology',
      'Transportation Planning & Pavement',
      'Surveying & GIS basics',
      'Construction Management & Scheduling',
    ],
    tools: ['AutoCAD Civil 3D', 'Revit', 'ETABS', 'SAP2000', 'STAAD.Pro', 'Plaxis / GeoStudio', 'MS Project / Primavera'],
  },
  'Industrial Engineering': {
    roles: [
      'Process Improvement Engineer',
      'Operations Research Analyst',
      'Quality & Reliability Engineer',
      'Supply Chain Analyst',
      'Simulation & Planning Specialist',
    ],
    technicalSkills: [
      'Operations Research & Optimization',
      'Lean Manufacturing & Six Sigma',
      'Quality Systems (SPC, DOE)',
      'Supply Chain & Logistics Design',
      'Discrete-Event Simulation',
      'Work Measurement & Ergonomics',
      'Production Planning & Scheduling',
    ],
    tools: ['Excel / advanced analytics', 'Arena / Simio / AnyLogic', 'Minitab', 'Tableau / Power BI', 'Visio', 'Python (ops analytics)'],
  },
  'Architectural Engineering': {
    roles: [
      'Building Systems (MEP) Engineer',
      'Energy & Sustainability Consultant',
      'BIM / Revit Specialist',
      'Acoustics / Lighting (building) focus',
    ],
    technicalSkills: [
      'HVAC Load & System Design',
      'Building Energy Modeling',
      'Building Codes & Compliance',
      'Integrated Building Design',
      'Daylighting & Environmental Quality',
      'Structural–Architecture coordination',
    ],
    tools: ['Revit', 'AutoCAD', 'TRACE 700 / IES VE', 'EnergyPlus', 'Rhino / Grasshopper (optional)', 'SketchUp'],
  },
  'Mechatronics Engineering': {
    roles: [
      'Mechatronics Integration Engineer',
      'Robotics Engineer',
      'Automation & Controls Engineer',
      'Embedded Systems (mechatronics)',
      'Motion Control Specialist',
    ],
    technicalSkills: [
      'Sensors, Actuators & Instrumentation',
      'Robotics Kinematics & Dynamics',
      'Industrial Automation & PLCs',
      'Embedded Control & Real-time Systems',
      'Mechanical–Electrical System Integration',
      'Motion Control & Servo Drives',
    ],
    tools: ['MATLAB / Simulink', 'ROS / ROS 2', 'SolidWorks', 'TwinCAT / TIA Portal', 'LabVIEW', 'Arduino / Raspberry Pi'],
  },
  'Energy and Renewable Energy Engineering': {
    roles: [
      'Renewable Energy Systems Engineer',
      'Solar PV Design Engineer',
      'Wind Resource / Wind Energy Analyst',
      'Energy Storage & Hybrid Systems Engineer',
      'Sustainability & Energy Policy Analyst',
    ],
    technicalSkills: [
      'Solar PV System Design & Yield',
      'Wind Resource Assessment & Turbines',
      'Energy Storage & Microgrids',
      'Grid Codes & Interconnection Studies',
      'Thermodynamic Cycles (power plants)',
      'Energy Economics & Project Feasibility',
    ],
    tools: ['PVsyst', 'HOMER Pro', 'MATLAB', 'OpenWind / WAsP (intro)', 'AutoCAD', 'RETScreen (optional)'],
  },
}

export function getSkillsPack(faculty: string | undefined, major: string | undefined): SkillPack | null {
  if (!faculty) return null

  if (faculty === 'Engineering and Information Technology') {
    if (major && ENGINEERING_MAJOR_PACKS[major]) return ENGINEERING_MAJOR_PACKS[major]
    return SKILLS_DATA.engineering
  }

  if (faculty === 'Information Technology') return SKILLS_DATA.tech

  if (faculty === 'Medicine and Health Sciences') {
    if (major && MEDICAL_MAJORS_USE_TECH.has(major)) return SKILLS_DATA.tech
    return SKILLS_DATA.medical
  }

  if (faculty === 'Science') {
    if (major && SCIENCE_MAJORS_USE_TECH.has(major)) return SKILLS_DATA.tech
    return SKILLS_DATA.science
  }

  const cat = FACULTY_CATEGORY[faculty]
  return cat ? SKILLS_DATA[cat] : null
}

/**
 * Coarse category (legacy). Prefer {@link getSkillsPack} for registration / profile chips.
 */
export function resolveSkillCategory(
  faculty: string | undefined,
  major: string | undefined
): SkillCategory | undefined {
  const pack = getSkillsPack(faculty, major)
  if (!pack) return undefined
  if (pack === SKILLS_DATA.tech) return 'tech'
  if (pack === SKILLS_DATA.medical) return 'medical'
  if (pack === SKILLS_DATA.science) return 'science'
  return 'engineering'
}

export const ALL_ROLES = [...new Set(Object.values(SKILLS_DATA).flatMap(d => d.roles))]
export const ALL_TECH_SKILLS = [...new Set(Object.values(SKILLS_DATA).flatMap(d => d.technicalSkills))]
export const ALL_TOOLS_LIST = [...new Set(Object.values(SKILLS_DATA).flatMap(d => d.tools))]

export function poolsForStudent(faculty: string | undefined, major?: string | undefined) {
  const skillsPool = getSkillsPack(faculty, major)
  return {
    rolesPool: skillsPool?.roles ?? ALL_ROLES,
    techPool: skillsPool?.technicalSkills ?? ALL_TECH_SKILLS,
    toolsPool: skillsPool?.tools ?? ALL_TOOLS_LIST,
  }
}
