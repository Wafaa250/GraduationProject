import api, { parseApiErrorMessage } from "./axiosInstance";

export const ORGANIZATION_EVENT_TYPES = [
  "Workshop",
  "Hackathon",
  "Competition",
  "Training",
  "Volunteer",
  "Orientation",
  "Community",
  "Media",
] as const;

export const ORGANIZATION_EVENT_CATEGORIES = [
  "Technical",
  "Volunteer",
  "Cultural",
  "Media",
  "Career",
  "Social",
] as const;

export type StudentOrganizationEvent = {
  id: number;
  organizationProfileId: number;
  title: string;
  description: string;
  eventType: string;
  category: string;
  location?: string | null;
  isOnline: boolean;
  eventDate: string;
  registrationDeadline?: string | null;
  coverImageUrl?: string | null;
  maxParticipants?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  organizationName?: string | null;
  organizationLogoUrl?: string | null;
};

export type CreateOrganizationEventPayload = {
  title: string;
  description: string;
  eventType: string;
  category: string;
  location?: string;
  isOnline: boolean;
  eventDate: string;
  registrationDeadline?: string;
  coverImageUrl?: string;
  maxParticipants?: number;
};

export type UpdateOrganizationEventPayload = Partial<CreateOrganizationEventPayload>;

export async function listOrganizationEvents(): Promise<StudentOrganizationEvent[]> {
  const { data } = await api.get<StudentOrganizationEvent[]>("/organization/events");
  return data;
}

export async function getOrganizationEvent(id: number): Promise<StudentOrganizationEvent> {
  const { data } = await api.get<StudentOrganizationEvent>(`/organization/events/${id}`);
  return data;
}

export async function createOrganizationEvent(
  payload: CreateOrganizationEventPayload,
): Promise<StudentOrganizationEvent> {
  const { data } = await api.post<StudentOrganizationEvent>("/organization/events", payload);
  return data;
}

export async function updateOrganizationEvent(
  id: number,
  payload: UpdateOrganizationEventPayload,
): Promise<StudentOrganizationEvent> {
  const { data } = await api.put<StudentOrganizationEvent>(`/organization/events/${id}`, payload);
  return data;
}

export async function deleteOrganizationEvent(id: number): Promise<void> {
  await api.delete(`/organization/events/${id}`);
}

export async function uploadOrganizationEventCoverFromUri(
  localUri: string,
  mimeType: string,
  filename = "cover.jpg",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);
  const { data } = await api.post<{ coverImageUrl: string }>(
    "/organization/events/upload-cover",
    formData,
    { headers: { "Content-Type": false as unknown as string } },
  );
  return data.coverImageUrl;
}

export { parseApiErrorMessage };
