namespace GraduationProject.API.Helpers
{
    public static class UserSearchHelper
    {
        public static string? ToProfilePictureUrl(string? base64)
        {
            var value = base64?.Trim();
            if (string.IsNullOrEmpty(value)) return null;
            if (value.StartsWith("data:", StringComparison.OrdinalIgnoreCase)) return value;
            return $"data:image/jpeg;base64,{value}";
        }
    }
}
