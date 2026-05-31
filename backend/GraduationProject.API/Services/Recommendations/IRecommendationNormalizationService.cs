namespace GraduationProject.API.Services.Recommendations
{
    public interface IRecommendationNormalizationService
    {
        string NormalizeTerm(string? term);
        List<string> NormalizeMany(IEnumerable<string> terms);
        List<string> Tokenize(string? text);
        HashSet<string> InferDisciplines(IEnumerable<string> signals);
        List<string> ExpandWithFamilies(IEnumerable<string> normalizedSkills);
    }
}
