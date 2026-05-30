using System;
using System.Collections.Generic;
using System.Text.Json;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class StudentSettingsHelper
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public static NotificationPreferencesDto DefaultNotificationPreferences() => new();

        public static NotificationPreferencesDto DeserializeNotificationPreferences(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return DefaultNotificationPreferences();

            try
            {
                return JsonSerializer.Deserialize<NotificationPreferencesDto>(json, JsonOptions)
                       ?? DefaultNotificationPreferences();
            }
            catch (JsonException)
            {
                return DefaultNotificationPreferences();
            }
        }

        public static List<string> DeserializeAiProjectInterests(string? json)
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

        public static string SerializeNotificationPreferences(NotificationPreferencesDto prefs) =>
            JsonSerializer.Serialize(prefs, JsonOptions);

        public static string SerializeAiProjectInterests(List<string> interests) =>
            JsonSerializer.Serialize(interests, JsonOptions);

        public static void ApplySettingsUpdate(StudentProfile profile, UpdateStudentSettingsDto dto)
        {
            if (dto.NotificationPreferences != null)
                profile.NotificationPreferences = SerializeNotificationPreferences(dto.NotificationPreferences);

            if (dto.AiProjectInterests != null)
                profile.AiProjectInterests = SerializeAiProjectInterests(dto.AiProjectInterests);
        }
    }
}
