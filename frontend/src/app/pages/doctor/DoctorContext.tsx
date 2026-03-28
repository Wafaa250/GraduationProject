// src/app/pages/doctor/DoctorContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../../../api/axiosInstance'
import { CourseChannel, GraduationProject } from './data/doctorMockData'

const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']

interface DoctorContextType {
  courses:        CourseChannel[]
  gradProjects:   GraduationProject[]
  loading:        boolean
  addCourse:      (data: { name: string; code: string; section: string }) => Promise<void>
  addGradProject: (data: { name: string }) => void
}

const DoctorContext = createContext<DoctorContextType>({
  courses: [], gradProjects: [], loading: false,
  addCourse: async () => {}, addGradProject: () => {},
})

function mapChannel(c: any): CourseChannel {
  return {
    id:            String(c.id),
    type:          'course',
    name:          c.name,
    courseCode:    c.courseCode,
    section:       c.section,
    studentsCount: c.studentsCount ?? 0,
    inviteCode:    c.inviteCode,
    inviteLink:    `https://platform.edu/join/${c.inviteCode}`,
    color:         c.color ?? '#6366f1',
    students:      [],
    teams:         [],
  }
}

export function DoctorProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses]           = useState<CourseChannel[]>([])
  const [gradProjects, setGradProjects] = useState<GraduationProject[]>([])
  const [loading, setLoading]           = useState(false)

  // ── جلب القنوات من الـ API عند التحميل ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoading(true)
    api.get('/doctor/channels')
      .then(res => setCourses(res.data.map(mapChannel)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── إنشاء قناة جديدة عبر الـ API ────────────────────────────────────────
  const addCourse = async (data: { name: string; code: string; section: string }) => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const res = await api.post('/doctor/channels', {
      name:       data.name,
      courseCode: data.code,
      section:    data.section || 'Section A',
      color,
    })
    setCourses(prev => [...prev, mapChannel(res.data)])
  }

  // ── Graduation Projects (فرونت فقط لحد ما يجهز الباك) ───────────────────
  const addGradProject = (data: { name: string }) => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    setGradProjects(prev => [...prev, {
      id:            `gp-${Date.now()}`,
      type:          'graduation',
      title:         data.name,
      supervisor:    localStorage.getItem('name') || 'Dr.',
      studentsCount: 0,
      students:      [],
      skills:        [],
      progress:      0,
      inviteCode:    `GRAD-${Date.now().toString().slice(-4)}`,
      color,
    }])
  }

  return (
    <DoctorContext.Provider value={{ courses, gradProjects, loading, addCourse, addGradProject }}>
      {children}
    </DoctorContext.Provider>
  )
}

export const useDoctor = () => useContext(DoctorContext)
