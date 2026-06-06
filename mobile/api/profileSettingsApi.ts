import api from "./axiosInstance";

export type NotificationPreferences = {
  teamInvitations: boolean;
  newMessages: boolean;
  supervisorUpdates: boolean;
  projectUpdates: boolean;
  courseAnnouncements: boolean;
};

export type StudentProfileSettings = {
  notificationPreferences: NotificationPreferences;
  aiProjectInterests: string[];
};

export type UpdateStudentProfileSettingsPayload = {
  notificationPreferences?: NotificationPreferences;
  aiProjectInterests?: string[];
};

export async function getProfileSettings(): Promise<StudentProfileSettings> {
  const { data } = await api.get<StudentProfileSettings>("/profile/settings");
  return data;
}

export async function updateProfileSettings(
  payload: UpdateStudentProfileSettingsPayload,
): Promise<StudentProfileSettings> {
  const { data } = await api.put<StudentProfileSettings & { message?: string }>(
    "/profile/settings",
    payload,
  );
  return {
    notificationPreferences: data.notificationPreferences,
    aiProjectInterests: data.aiProjectInterests,
  };
}
