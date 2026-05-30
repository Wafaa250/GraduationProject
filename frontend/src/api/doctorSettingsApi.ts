import api from "./axiosInstance";

export type DoctorNotificationPreferences = {
  newMessages: boolean;
  supervisionRequests: boolean;
  projectRequests: boolean;
  courseProjectUpdates: boolean;
  teamFormationUpdates: boolean;
};

export type DoctorSupervisionPreferences = {
  supervisionCapacity: number;
  availableForSupervision: boolean;
};

export type DoctorProfileSettings = {
  notificationPreferences: DoctorNotificationPreferences;
  supervisionPreferences: DoctorSupervisionPreferences;
};

export type UpdateDoctorProfileSettingsPayload = {
  notificationPreferences?: DoctorNotificationPreferences;
  supervisionPreferences?: DoctorSupervisionPreferences;
};

/** GET /api/profile/doctor/settings */
export async function getDoctorProfileSettings(): Promise<DoctorProfileSettings> {
  const { data } = await api.get<DoctorProfileSettings>("/profile/doctor/settings");
  return data;
}

/** PUT /api/profile/doctor/settings */
export async function updateDoctorProfileSettings(
  payload: UpdateDoctorProfileSettingsPayload,
): Promise<DoctorProfileSettings> {
  const { data } = await api.put<DoctorProfileSettings & { message?: string }>(
    "/profile/doctor/settings",
    payload,
  );
  return {
    notificationPreferences: data.notificationPreferences,
    supervisionPreferences: data.supervisionPreferences,
  };
}
