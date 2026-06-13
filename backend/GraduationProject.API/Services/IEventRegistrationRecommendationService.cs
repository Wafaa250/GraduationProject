using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    public interface IEventRegistrationRecommendationService
    {
        Task<EventRegistrationRecommendationOutcome> RankRegistrantsAsync(
            EventRegistrationRecommendationContext context,
            CancellationToken cancellationToken = default);
    }

    public class EventRegistrationRecommendationContext
    {
        public EventRegistrationEventContext Event { get; set; } = new();
        public List<EventRegistrationParticipantContext> Participants { get; set; } = new();
    }

    public class EventRegistrationEventContext
    {
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class EventRegistrationParticipantContext
    {
        public int RegistrationId { get; set; }
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string Faculty { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public List<string> Interests { get; set; } = new();
        public List<EventRegistrationAnswerContext> FormAnswers { get; set; } = new();
    }

    public class EventRegistrationAnswerContext
    {
        public string FieldLabel { get; set; } = string.Empty;
        public string AnswerValue { get; set; } = string.Empty;
    }

    public class EventRegistrationRecommendationOutcome
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public bool UsedAi { get; set; }
        public List<EventRegistrationRankedParticipant> Rankings { get; set; } = new();

        public static EventRegistrationRecommendationOutcome Fail(string message) =>
            new() { Success = false, ErrorMessage = message };

        public static EventRegistrationRecommendationOutcome Ok(
            List<EventRegistrationRankedParticipant> rankings,
            bool usedAi) =>
            new() { Success = true, Rankings = rankings, UsedAi = usedAi };
    }

    public class EventRegistrationRankedParticipant
    {
        public int RegistrationId { get; set; }
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? StudentMajor { get; set; }
        public int MatchScore { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
