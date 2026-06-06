import api, { parseApiErrorMessage } from "./axiosInstance";
import { appendMobileUploadFile, type MobileUploadFile } from "./mobileUpload";

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
  isPublished: boolean;
  organizationName?: string | null;
  organizationLogoUrl?: string | null;
};

export type PublishOrganizationEventResponse = {
  id: number;
  isPublished: boolean;
  message: string;
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

export async function publishOrganizationEvent(
  id: number,
): Promise<PublishOrganizationEventResponse> {
  const { data } = await api.post<PublishOrganizationEventResponse>(
    `/organization/events/${id}/publish`,
  );
  return data;
}

export async function uploadOrganizationEventCover(file: MobileUploadFile): Promise<string> {
  const formData = new FormData();
  appendMobileUploadFile(formData, "file", file);
  const { data } = await api.post<{ coverImageUrl: string }>(
    "/organization/events/upload-cover",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.coverImageUrl;
}

export { parseApiErrorMessage };
