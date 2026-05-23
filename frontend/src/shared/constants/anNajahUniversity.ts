/** Static academic catalog — An-Najah National University (expandable later). */

export const AN_NAJAH_UNIVERSITY = 'An-Najah National University'

export const UNIVERSITY_OPTIONS = [{ value: AN_NAJAH_UNIVERSITY, label: AN_NAJAH_UNIVERSITY }] as const

export const AN_NAJAH_FACULTIES = [
  'Faculty of Engineering & Information Technology',
  'Faculty of Medicine and Health Sciences',
  'Faculty of Science',
  'Faculty of Humanities',
  'Faculty of Educational Sciences and Teachers\' Training',
  'Faculty of Law',
  'Faculty of Economics and Social Sciences',
  'Faculty of Fine Arts',
  'Faculty of Pharmacy',
  'Faculty of Agriculture and Veterinary Medicine',
  'Faculty of Sharia',
  'Faculty of Dentistry',
] as const

export type AnNajahFaculty = (typeof AN_NAJAH_FACULTIES)[number]

export const MAJORS_BY_FACULTY: Record<AnNajahFaculty, readonly string[]> = {
  'Faculty of Engineering & Information Technology': [
    'Computer Engineering',
    'Computer Science',
    'Telecommunications Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Industrial Engineering',
    'Architectural Engineering',
    'Surveying Engineering',
    'Mechatronics Engineering',
  ],
  'Faculty of Medicine and Health Sciences': [
    'Medicine',
    'Medical Laboratory Sciences',
    'Nursing',
    'Physiotherapy',
    'Radiology',
    'Public Health',
  ],
  'Faculty of Science': [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Biotechnology',
    'Earth and Environmental Sciences',
  ],
  'Faculty of Humanities': [
    'Arabic Language and Literature',
    'English Language and Literature',
    'History',
    'Geography',
    'Media and Journalism',
    'Translation',
  ],
  'Faculty of Educational Sciences and Teachers\' Training': [
    'Classroom Teacher',
    'Educational Technology',
    'Special Education',
    'Kindergarten Education',
    'Physical Education',
  ],
  'Faculty of Law': ['Law'],
  'Faculty of Economics and Social Sciences': [
    'Business Administration',
    'Accounting',
    'Finance and Banking',
    'Economics',
    'Political Science',
    'Social Work',
  ],
  'Faculty of Fine Arts': [
    'Graphic Design',
    'Interior Design',
    'Visual Arts',
    'Music',
  ],
  'Faculty of Pharmacy': ['Pharmacy', 'Pharmaceutical Sciences'],
  'Faculty of Agriculture and Veterinary Medicine': [
    'Agricultural Sciences',
    'Food Science and Technology',
    'Veterinary Medicine',
  ],
  'Faculty of Sharia': ['Sharia and Islamic Studies', 'Fundamentals of Religion'],
  'Faculty of Dentistry': ['Dentistry', 'Oral and Dental Medicine'],
}

export function getFacultyOptions() {
  return AN_NAJAH_FACULTIES.map((f) => ({ value: f, label: f }))
}

export function getMajorOptions(faculty: string) {
  const majors = MAJORS_BY_FACULTY[faculty as AnNajahFaculty]
  if (!majors) return []
  return majors.map((m) => ({ value: m, label: m }))
}
