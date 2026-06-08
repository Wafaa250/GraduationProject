namespace GraduationProject.API.Data.Seeding
{
    internal static class NajahSeedConstants
    {
        public const string UniversityName = "An-Najah National University";
        public const string UniversityFaculty = "Faculty of Engineering and Information Technology";
        public const string StudentDoctorEmailDomain = "gmail.com";

        public static readonly string[] LegacyUniversityDomains =
        {
            "birzeit.edu", "najah.edu", "anajah.edu", "ppu.edu", "alquds.edu", "aau.edu", "bethlehem.edu", "metrosu.edu",
        };

        public static readonly string[] OtherUniversityNames =
        {
            "Birzeit University",
            "Palestine Polytechnic University",
            "Al-Quds University",
            "Arab American University",
            "Bethlehem University",
            "Metropolitan State University",
            "AAU",
            "AAUP",
            "PPU",
        };

        public static readonly (string OldUsername, string NewName, string NewUsername, string Description)[] AssociationReplacements =
        {
            ("ieee-birzeit", "IEEE An-Najah Student Branch", "ieee-anajah",
             "IEEE An-Najah organizes technical workshops, hardware labs, and industry talks for engineering students."),
            ("gdsc-najah", "Google Developer Student Club An-Najah", "gdsc-anajah",
             "GDSC An-Najah hosts study jams, Android clinics, and cloud certification prep sessions."),
            ("oss-najah", "Open Source Collective — An-Najah", "oss-anajah",
             "Open Source Collective at An-Najah contributes to Arabic localization, documentation sprints, and GitHub workshops."),
            ("lug-najah", "Linux User Group — An-Najah", "lug-anajah",
             "Linux User Group at An-Najah promotes open-source adoption, server administration workshops, and campus infrastructure projects."),
            ("cloudnative-najah", "Cloud Native Club — An-Najah", "cloudnative-anajah",
             "Cloud Native Club at An-Najah studies Kubernetes, observability stacks, and platform engineering career paths."),
            ("cyber-ppu", "Cyber Security Club — An-Najah", "cyber-anajah",
             "Cyber Security Club at An-Najah runs CTF practice, ethical hacking workshops, and campus awareness campaigns."),
            ("robotics-alquds", "Robotics Club — An-Najah", "robotics-anajah",
             "Robotics Club at An-Najah builds autonomous platforms, drone prototypes, and competes in regional contests."),
            ("ai-aau", "AI Club — An-Najah", "ai-anajah",
             "AI Club at An-Najah explores machine learning projects, model deployment workshops, and research reading groups."),
            ("entrepreneurship-bethlehem", "Entrepreneurship Club — An-Najah", "entrepreneurship-anajah",
             "Entrepreneurship Club at An-Najah mentors founders, hosts pitch nights, and connects students with local incubators."),
            ("wit-birzeit", "Women in Tech — An-Najah", "wit-anajah",
             "Women in Tech at An-Najah supports mentorship circles, interview prep, and inclusive hackathon teams."),
            ("media-ppu", "Media & Design Society — An-Najah", "media-anajah",
             "Media Society at An-Najah produces campus documentaries, motion graphics tutorials, and live event coverage."),
            ("volunteer-alquds", "Volunteer Tech Corps — An-Najah", "volunteer-anajah",
             "Volunteer Tech Corps at An-Najah refurbishes laptops and teaches digital literacy in Nablus communities."),
            ("data-aau", "Data Science Society — An-Najah", "data-anajah",
             "Data Science Society at An-Najah hosts Kaggle study groups, visualization challenges, and analytics career panels."),
            ("acm-birzeit", "ACM An-Najah Student Chapter", "acm-anajah",
             "ACM An-Najah hosts competitive programming training, industry seminars, and coding interview workshops."),
            ("design-ppu", "Design Thinking Society — An-Najah", "design-anajah",
             "Design Thinking Society at An-Najah runs ideation sprints, prototyping nights, and social innovation challenges."),
            ("gamedev-alquds", "Programming Club — An-Najah", "programming-anajah",
             "Programming Club at An-Najah collaborates on algorithms practice, competitive programming, and portfolio reviews."),
            ("fintech-aau", "FinTech Student Network — An-Najah", "fintech-anajah",
             "FinTech Network at An-Najah connects students with payment startups, hackathons, and compliance workshops."),
            ("wie-bethlehem", "IEEE Women in Engineering — An-Najah", "wie-anajah",
             "IEEE WIE An-Najah mentors women engineers through technical talks, shadowing, and leadership programs."),
            ("makers-ppu", "Palestine Makerspace Alliance — An-Najah", "makers-anajah",
             "Makerspace Alliance at An-Najah operates electronics benches, 3D printers, and hardware mentorship hours."),
            ("consult-birzeit", "Student Consultancy Group — An-Najah", "consult-anajah",
             "Student Consultancy at An-Najah delivers pro-bono digital strategy projects for local NGOs."),
        };
    }
}
