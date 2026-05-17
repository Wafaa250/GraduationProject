using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;

namespace GraduationProject.API.Helpers
{
    public static class RecruitmentApplicationHelper
    {
        public static IEnumerable<StudentOrganizationRecruitmentQuestion> GetApplicableQuestions(
            IEnumerable<StudentOrganizationRecruitmentQuestion> questions,
            int positionId) =>
            questions
                .Where(q => q.PositionId == null || q.PositionId == positionId)
                .OrderBy(q => q.DisplayOrder)
                .ThenBy(q => q.Id);

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
            IEnumerable<StudentOrganizationRecruitmentQuestion> applicableQuestions,
            List<RecruitmentApplicationAnswerInputDto> answers)
        {
            var answerMap = answers
                .GroupBy(a => a.QuestionId)
                .ToDictionary(g => g.Key, g => g.Last());

            foreach (var question in applicableQuestions)
            {
                answerMap.TryGetValue(question.Id, out var input);
                var type = RecruitmentQuestionTypes.Link.Equals(question.QuestionType, StringComparison.Ordinal)
                    ? RecruitmentQuestionTypes.Url
                    : question.QuestionType;

                if (question.IsRequired)
                {
                    if (input == null || !HasAnswer(input, type))
                        return $"\"{question.QuestionTitle}\" is required.";
                }

                if (input == null) continue;

                if (RecruitmentQuestionTypes.UsesOptions(type))
                {
                    var options = ParseOptions(question.Options) ?? new List<string>();
                    if (type == RecruitmentQuestionTypes.CheckboxList)
                    {
                        var selected = input.Values ?? new List<string>();
                        if (selected.Any(v => !options.Contains(v, StringComparer.Ordinal)))
                            return $"Invalid option selected for \"{question.QuestionTitle}\".";
                    }
                    else
                    {
                        var value = input.Value?.Trim();
                        if (!string.IsNullOrEmpty(value) && !options.Contains(value, StringComparer.Ordinal))
                            return $"Invalid option selected for \"{question.QuestionTitle}\".";
                    }
                }

                if (type == RecruitmentQuestionTypes.Email && !string.IsNullOrWhiteSpace(input.Value))
                {
                    if (!input.Value.Contains('@', StringComparison.Ordinal))
                        return $"Enter a valid email for \"{question.QuestionTitle}\".";
                }
            }

            var allowedIds = applicableQuestions.Select(q => q.Id).ToHashSet();
            foreach (var a in answers)
            {
                if (!allowedIds.Contains(a.QuestionId))
                    return "One or more answers reference invalid questions for this position.";
            }

            return null;
        }

        private static bool HasAnswer(RecruitmentApplicationAnswerInputDto input, string type)
        {
            if (type == RecruitmentQuestionTypes.CheckboxList)
                return input.Values != null && input.Values.Any(v => !string.IsNullOrWhiteSpace(v));

            return !string.IsNullOrWhiteSpace(input.Value);
        }

        public static string NormalizeStoredAnswer(
            RecruitmentApplicationAnswerInputDto input,
            string questionType)
        {
            var type = RecruitmentQuestionTypes.Link.Equals(questionType, StringComparison.Ordinal)
                ? RecruitmentQuestionTypes.Url
                : questionType;

            if (type == RecruitmentQuestionTypes.CheckboxList)
                return SerializeCheckboxValues(input.Values ?? new List<string>());

            return (input.Value ?? string.Empty).Trim();
        }

        public static RecruitmentApplicationAnswerResponseDto MapAnswerResponse(
            StudentOrganizationRecruitmentApplicationAnswer answer)
        {
            var type = answer.Question.QuestionType;
            var dto = new RecruitmentApplicationAnswerResponseDto
            {
                QuestionId = answer.QuestionId,
                QuestionTitle = answer.Question.QuestionTitle,
                QuestionType = type,
                AnswerValue = answer.AnswerValue,
            };

            if (type == RecruitmentQuestionTypes.CheckboxList)
            {
                dto.SelectedValues = DeserializeCheckboxValues(answer.AnswerValue);
                dto.AnswerValue = string.Join(", ", dto.SelectedValues ?? new List<string>());
            }

            return dto;
        }
    }
}
