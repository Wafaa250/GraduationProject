// src/app/pages/doctor/data/doctorMockData.ts

export interface DoctorStudent {
  id: number
  name: string
  studentId: string
  email: string
  avatar: string
}

export interface DoctorTeam {
  id: string
  name: string
  projectTitle: string
  skills: string[]
  members: DoctorStudent[]
}

export interface CourseChannel {
  id: string
  type: 'course'
  name: string
  courseCode: string
  section: string
  studentsCount: number
  inviteCode: string
  inviteLink: string
  color: string
  students: DoctorStudent[]
  teams: DoctorTeam[]
}

export interface GraduationProject {
  id: string
  type: 'graduation'
  title: string
  supervisor: string
  studentsCount: number
  students: DoctorStudent[]
  skills: string[]
  progress: number
  inviteCode: string
  color: string
}

export const STATS = {
  totalCourses:      0,
  totalGradProjects: 0,
  totalStudents:     0,
  activeTeams:       0,
}
