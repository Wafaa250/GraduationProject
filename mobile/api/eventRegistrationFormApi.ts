import api, { parseApiErrorMessage } from "./axiosInstance";

export type EventRegistrationField = {
  id: number;
  formId: number;
  label: string;
  fieldType: string;
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  options?: string[] | null;
  displayOrder: number;
  createdAt: string;
};

export type EventRegistrationForm = {
  id: number;
  eventId: number;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  fields: EventRegistrationField[];
};

export { parseApiErrorMessage };

export async function getEventRegistrationForm(eventId: number): Promise<EventRegistrationForm | null> {
  try {
    const { data } = await api.get<EventRegistrationForm>(
      `/organization/events/${eventId}/registration-form`,
    );
    return data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}

export async function createEventRegistrationForm(
  eventId: number,
  payload: { title: string; description?: string | null },
): Promise<EventRegistrationForm> {
  const { data } = await api.post<EventRegistrationForm>(
    `/organization/events/${eventId}/registration-form`,
    payload,
  );
  return data;
}

export async function updateEventRegistrationForm(
  eventId: number,
  payload: { title?: string; description?: string | null },
): Promise<EventRegistrationForm> {
  const { data } = await api.put<EventRegistrationForm>(
    `/organization/events/${eventId}/registration-form`,
    payload,
  );
  return data;
}

export async function createEventRegistrationField(
  eventId: number,
  payload: {
    label: string;
    fieldType: string;
    placeholder?: string | null;
    helpText?: string | null;
    isRequired: boolean;
    options?: string[] | null;
    displayOrder: number;
  },
): Promise<EventRegistrationField> {
  const { data } = await api.post<EventRegistrationField>(
    `/organization/events/${eventId}/registration-form/fields`,
    payload,
  );
  return data;
}

export async function updateEventRegistrationField(
  eventId: number,
  fieldId: number,
  payload: Partial<{
    label: string;
    fieldType: string;
    placeholder?: string | null;
    helpText?: string | null;
    isRequired: boolean;
    options?: string[] | null;
    displayOrder: number;
  }>,
): Promise<EventRegistrationField> {
  const { data } = await api.put<EventRegistrationField>(
    `/organization/events/${eventId}/registration-form/fields/${fieldId}`,
    payload,
  );
  return data;
}

export async function deleteEventRegistrationField(eventId: number, fieldId: number): Promise<void> {
  await api.delete(`/organization/events/${eventId}/registration-form/fields/${fieldId}`);
}
