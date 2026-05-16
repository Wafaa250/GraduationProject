using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public static class RecruitmentQuestionTypes
    {
        public const string ShortText = "ShortText";
        public const string Paragraph = "Paragraph";
        public const string MultipleChoice = "MultipleChoice";
        public const string CheckboxList = "CheckboxList";
        public const string Dropdown = "Dropdown";
        public const string Number = "Number";
        public const string Email = "Email";
        public const string Url = "Url";
        /// <summary>Legacy alias; treated like Url on clients.</summary>
        public const string Link = "Link";
        public const string FileUpload = "FileUpload";
        public const string Date = "Date";
        public const string YesNo = "YesNo";

        public static readonly HashSet<string> All = new(StringComparer.Ordinal)
        {
            ShortText, Paragraph, MultipleChoice, CheckboxList, Dropdown,
            Number, Email, Url, Link, FileUpload, Date, YesNo,
        };

        public static bool UsesOptions(string questionType) =>
            questionType is MultipleChoice or CheckboxList or Dropdown;
    }

    public class CreateRecruitmentQuestionDto
    {
        [Required(ErrorMessage = "Field label is required.")]
        [MaxLength(500)]
        public string QuestionTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Field type is required.")]
        [MaxLength(32)]
        public string QuestionType { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Placeholder { get; set; }

        [MaxLength(2000)]
        public string? HelpText { get; set; }

        public bool IsRequired { get; set; }

        public List<string>? Options { get; set; }

        public int DisplayOrder { get; set; }

        /// <summary>Null = shared campaign form; otherwise the position this field belongs to.</summary>
        public int? PositionId { get; set; }
    }

    public class UpdateRecruitmentQuestionDto
    {
        [MaxLength(500)]
        public string? QuestionTitle { get; set; }

        [MaxLength(32)]
        public string? QuestionType { get; set; }

        [MaxLength(500)]
        public string? Placeholder { get; set; }

        [MaxLength(2000)]
        public string? HelpText { get; set; }

        public bool? IsRequired { get; set; }

        public List<string>? Options { get; set; }

        public int? DisplayOrder { get; set; }

        public int? PositionId { get; set; }
    }

    public class RecruitmentQuestionResponseDto
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public string QuestionTitle { get; set; } = string.Empty;
        public string QuestionType { get; set; } = string.Empty;
        public string? Placeholder { get; set; }
        public string? HelpText { get; set; }
        public bool IsRequired { get; set; }
        public List<string>? Options { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? PositionId { get; set; }
        public string? PositionRoleTitle { get; set; }
    }
}
