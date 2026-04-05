// src/api/supervisorApi.ts

import api from './axiosInstance'

// ─── Types ───────────────────────────────────────────────────

export interface Supervisor {
  doctorId: number
  name: string
  specialization: string | null
  matchScore: number
}

export interface SupervisorRequest {
  requestId: number
  project: {
    projectId: number
    name: string
    description: string | null
    requiredSkills: string[]
  }
  sender: {
    studentId: number
    name: string
    major: string
    university: string
  }
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  respondedAt: string | null
}

// ─── Student Side ───────────────────────────────────────────

// GET recommended supervisors
export const getRecommendedSupervisors = async (
  projectId: number
): Promise<Supervisor[]> => {
  const res = await api.get(
    `/graduation-projects/${projectId}/recommended-supervisors`
  )
  return res.data
}

// POST request supervisor
export const requestSupervisor = async (
  projectId: number,
  doctorId: number
): Promise<{ message: string; requestId: number }> => {
  const res = await api.post(
    `/graduation-projects/${projectId}/request-supervisor/${doctorId}`
  )
  return res.data
}

// ─── Doctor Side ───────────────────────────────────────────

// GET doctor requests
export const getDoctorRequests = async (): Promise<SupervisorRequest[]> => {
  const res = await api.get('/doctors/me/requests')
  return res.data
}

// Accept
export const acceptSupervisorRequest = async (id: number) => {
  const res = await api.post(`/supervisor-requests/${id}/accept`)
  return res.data
}

// Reject
export const rejectSupervisorRequest = async (id: number) => {
  const res = await api.post(`/supervisor-requests/${id}/reject`)
  return res.data
}