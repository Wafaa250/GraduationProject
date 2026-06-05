import api, { parseApiErrorMessage } from './axiosInstance'

export type EventRegistrationAnswerInput = {
  fieldId: number
  value?: string | null
  values?: string[] | null
}

export type StudentEventRegistrationStatus = {
  hasSubmitted: boolean
  registrationId?: number | null
  submittedAt?: string | null
  organizationId?: number
  organizationName?: string
  eventId?: number
  eventTitle?: string
}

export type EventRegistrationSubmitResponse = {
  registrationId: number
  submittedAt: string
  message: string
}

export type EventRegistrationListItem = {
  id: number
  studentProfileId: number
  studentName: string
  studentEmail?: string | null
  studentMajor?: string | null
  submittedAt: string
  previewAnswer: string
}

export type EventRegistrationAnswerDetail = {
  fieldId: number
  fieldLabel: string
  fieldType: string
  answerValue: string
  selectedValues?: string[] | null
}

export type EventRegistrationDetail = {
  id: number
  organizationId: number
  eventId: number
  eventTitle: string
  studentProfileId: number
  studentName: string
  studentEmail?: string | null
  studentMajor?: string | null
  studentAcademicYear?: string | null
  submittedAt: string
  answers: EventRegistrationAnswerDetail[]
}

export { parseApiErrorMessage }

export async function getMyEventRegistration(
  organizationId: number,
  eventId: number,
): Promise<StudentEventRegistrationStatus> {
  const { data } = await api.get<StudentEventRegistrationStatus>(
    `/organizations/${organizationId}/events/${eventId}/registrations/mine`,
  )
  return data
}

export async function submitEventRegistration(
  organizationId: number,
  eventId: number,
  answers: EventRegistrationAnswerInput[],
): Promise<EventRegistrationSubmitResponse> {
  const { data } = await api.post<EventRegistrationSubmitResponse>(
    `/organizations/${organizationId}/events/${eventId}/registrations`,
    { answers },
  )
  return data
}

export async function listOrganizationEventRegistrations(
  eventId: number,
): Promise<EventRegistrationListItem[]> {
  const { data } = await api.get<EventRegistrationListItem[]>(
    `/organization/events/${eventId}/registrations`,
  )
  return data
}

export async function getOrganizationEventRegistration(
  eventId: number,
  registrationId: number,
): Promise<EventRegistrationDetail> {
  const { data } = await api.get<EventRegistrationDetail>(
    `/organization/events/${eventId}/registrations/${registrationId}`,
  )
  return data
}
