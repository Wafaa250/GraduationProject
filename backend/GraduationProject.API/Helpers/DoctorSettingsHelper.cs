using System;
using System.Collections.Generic;
using System.Text.Json;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class DoctorSettingsHelper
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public static DoctorNotificationPreferencesDto DefaultNotificationPreferences() => new();

        public static DoctorSupervisionPreferencesDto DefaultSupervisionPreferences(DoctorProfile profile) =>
            new()
            {
                SupervisionCapacity = profile.SupervisionCapacity > 0 ? profile.SupervisionCapacity : 5,
                AvailableForSupervision = profile.AvailableForSupervision,
            };

        public static DoctorNotificationPreferencesDto DeserializeNotificationPreferences(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return DefaultNotificationPreferences();

            try
            {
                return JsonSerializer.Deserialize<DoctorNotificationPreferencesDto>(json, JsonOptions)
                       ?? DefaultNotificationPreferences();
            }
            catch (JsonException)
            {
                return DefaultNotificationPreferences();
            }
        }

        public static List<string> DeserializeStringList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<string>();

            try
            {
                return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? new List<string>();
            }
            catch (JsonException)
            {
                return new List<string>();
            }
        }

        public static string SerializeNotificationPreferences(DoctorNotificationPreferencesDto prefs) =>
            JsonSerializer.Serialize(prefs, JsonOptions);

        public static string SerializeStringList(List<string> values) =>
            JsonSerializer.Serialize(values, JsonOptions);

        public static void ApplySettingsUpdate(DoctorProfile profile, UpdateDoctorSettingsDto dto)
        {
            if (dto.NotificationPreferences != null)
                profile.NotificationPreferences = SerializeNotificationPreferences(dto.NotificationPreferences);

            if (dto.SupervisionPreferences != null)
            {
                var prefs = dto.SupervisionPreferences;
                profile.SupervisionCapacity = Math.Max(0, prefs.SupervisionCapacity);
                profile.AvailableForSupervision = prefs.AvailableForSupervision;
            }
        }
    }
}
