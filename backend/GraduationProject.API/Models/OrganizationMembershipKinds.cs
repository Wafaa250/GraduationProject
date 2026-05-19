namespace GraduationProject.API.Models
{
    public static class OrganizationMembershipKinds
    {
        public const string Leadership = "Leadership";
        public const string Member = "Member";

        public static readonly HashSet<string> All = new(StringComparer.Ordinal)
        {
            Leadership, Member,
        };
    }
}
