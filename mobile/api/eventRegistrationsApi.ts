import api, { parseApiErrorMessage } from "./axiosInstance";

export type EventRegistrationListItem = {
  id: number;
  studentProfileId: number;
  studentName: string;
  studentEmail?: string | null;
  studentMajor?: string | null;
  submittedAt: string;
  previewAnswer: string;
};

export type EventRegistrationAnswerDetail = {
  fieldId: number;
  fieldLabel: string;
  fieldType: string;
  answerValue: string;
  selectedValues?: string[] | null;
};

export type EventRegistrationDetail = {
  id: number;
  organizationId: number;
  eventId: number;
  eventTitle: string;
  studentProfileId: number;
  studentName: string;
  studentEmail?: string | null;
  studentMajor?: string | null;
  studentAcademicYear?: string | null;
  submittedAt: string;
  answers: EventRegistrationAnswerDetail[];
};

export async function listOrganizationEventRegistrations(
  eventId: number,
): Promise<EventRegistrationListItem[]> {
  const { data } = await api.get<EventRegistrationListItem[]>(
    `/organization/events/${eventId}/registrations`,
  );
  return data;
}

export async function getOrganizationEventRegistration(
  eventId: number,
  registrationId: number,
): Promise<EventRegistrationDetail> {
  const { data } = await api.get<EventRegistrationDetail>(
    `/organization/events/${eventId}/registrations/${registrationId}`,
  );
  return data;
}

export { parseApiErrorMessage };
