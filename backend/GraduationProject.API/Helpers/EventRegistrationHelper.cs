using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class EventRegistrationHelper
    {
        public static string NormalizeFieldType(string fieldType)
        {
            var t = fieldType.Trim();
            if (t.Equals(EventRegistrationFieldTypes.Link, StringComparison.Ordinal))
                return EventRegistrationFieldTypes.Url;
            if (t.Equals("FileUpload", StringComparison.Ordinal))
                return EventRegistrationFieldTypes.FileUploadPlaceholder;
            return t;
        }

        public static List<string>? ParseOptions(string? optionsJson)
        {
            if (string.IsNullOrWhiteSpace(optionsJson)) return null;
            try
            {
                return JsonSerializer.Deserialize<List<string>>(optionsJson);
            }
            catch
            {
                return null;
            }
        }

        public static string SerializeCheckboxValues(IEnumerable<string> values) =>
            JsonSerializer.Serialize(values.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList());

        public static List<string>? DeserializeCheckboxValues(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            try
            {
                return JsonSerializer.Deserialize<List<string>>(raw);
            }
            catch
            {
                return new List<string> { raw };
            }
        }

        public static string? ValidateAnswers(
            IEnumerable<StudentOrganizationEventRegistrationField> fields,
            List<EventRegistrationAnswerInputDto> answers)
        {
            var orderedFields = fields
                .OrderBy(f => f.DisplayOrder)
                .ThenBy(f => f.Id)
                .ToList();

            if (orderedFields.Count == 0)
                return "This event has no registration form configured yet.";

            var answerMap = answers
                .GroupBy(a => a.FieldId)
                .ToDictionary(g => g.Key, g => g.Last());

            foreach (var field in orderedFields)
            {
                answerMap.TryGetValue(field.Id, out var input);
                var type = NormalizeFieldType(field.FieldType);

                if (field.IsRequired)
                {
                    if (input == null || !HasAnswer(input, type))
                        return $"\"{field.Label}\" is required.";
                }

                if (input == null) continue;

                if (EventRegistrationFieldTypes.UsesOptions(type))
                {
                    var options = ParseOptions(field.Options) ?? new List<string>();
                    if (type == EventRegistrationFieldTypes.CheckboxList)
                    {
                        var selected = input.Values ?? new List<string>();
                        if (selected.Any(v => !options.Contains(v, StringComparer.Ordinal)))
                            return $"Invalid option selected for \"{field.Label}\".";
                    }
                    else
                    {
                        var value = input.Value?.Trim();
                        if (!string.IsNullOrEmpty(value) && !options.Contains(value, StringComparer.Ordinal))
                            return $"Invalid option selected for \"{field.Label}\".";
                    }
                }

                if (type == EventRegistrationFieldTypes.Email && !string.IsNullOrWhiteSpace(input.Value))
                {
                    if (!input.Value.Contains('@', StringComparison.Ordinal))
                        return $"Enter a valid email for \"{field.Label}\".";
                }
            }

            var allowedIds = orderedFields.Select(f => f.Id).ToHashSet();
            foreach (var a in answers)
            {
                if (!allowedIds.Contains(a.FieldId))
                    return "One or more answers reference invalid fields for this event.";
            }

            return null;
        }

        private static bool HasAnswer(EventRegistrationAnswerInputDto input, string type)
        {
            if (type == EventRegistrationFieldTypes.CheckboxList)
                return input.Values != null && input.Values.Any(v => !string.IsNullOrWhiteSpace(v));

            return !string.IsNullOrWhiteSpace(input.Value);
        }

        public static string NormalizeStoredAnswer(EventRegistrationAnswerInputDto input, string fieldType)
        {
            var type = NormalizeFieldType(fieldType);

            if (type == EventRegistrationFieldTypes.CheckboxList)
                return SerializeCheckboxValues(input.Values ?? new List<string>());

            return (input.Value ?? string.Empty).Trim();
        }

        public static EventRegistrationAnswerResponseDto MapAnswerResponse(
            StudentOrganizationEventRegistrationAnswer answer)
        {
            var type = NormalizeFieldType(answer.Field.FieldType);
            var dto = new EventRegistrationAnswerResponseDto
            {
                FieldId = answer.FieldId,
                FieldLabel = answer.Field.Label,
                FieldType = type,
                AnswerValue = answer.AnswerValue,
            };

            if (type == EventRegistrationFieldTypes.CheckboxList)
            {
                dto.SelectedValues = DeserializeCheckboxValues(answer.AnswerValue);
                dto.AnswerValue = string.Join(", ", dto.SelectedValues ?? new List<string>());
            }

            return dto;
        }

        public static bool IsRegistrationDeadlinePassed(DateTime? registrationDeadline, DateTime utcNow)
        {
            if (!registrationDeadline.HasValue) return false;
            var deadline = registrationDeadline.Value;
            if (deadline.Kind == DateTimeKind.Unspecified)
                deadline = DateTime.SpecifyKind(deadline, DateTimeKind.Utc);
            else
                deadline = deadline.ToUniversalTime();
            return utcNow > deadline;
        }
    }
}
