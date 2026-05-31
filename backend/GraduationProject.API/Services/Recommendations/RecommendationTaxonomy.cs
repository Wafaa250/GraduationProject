using System.Collections.Generic;

namespace GraduationProject.API.Services.Recommendations
{
    public static class RecommendationTaxonomy
    {
        public static readonly Dictionary<string, string> SkillAliases =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["ui designer"] = "ui/ux design",
                ["ui ux designer"] = "ui/ux design",
                ["product designer"] = "ui/ux design",
                ["ui engineer"] = "frontend engineering",
                ["frontend developer"] = "frontend engineering",
                ["react developer"] = "frontend engineering",
                ["web developer"] = "frontend engineering",
                ["next.js"] = "frontend engineering",
                ["nextjs"] = "frontend engineering",
                ["react native"] = "mobile development",
                ["flutter"] = "mobile development",
                ["dart"] = "mobile development",
                ["ux design"] = "ui/ux design",
                ["ui design"] = "ui/ux design",
                ["figma"] = "ui/ux design",
                ["asp.net"] = ".net backend",
                ["aspnet"] = ".net backend",
                [".net backend"] = ".net backend",
                ["api development"] = "backend engineering",
                ["rest api"] = "backend engineering",
                ["backend development"] = "backend engineering",
                ["backend developer"] = "backend engineering",
                ["server-side"] = "backend engineering",
                ["machine learning"] = "ml/ai",
                ["deep learning"] = "ml/ai",
                ["artificial intelligence"] = "ml/ai",
                ["data science"] = "ml/ai",
                ["financial modeling"] = "finance analysis",
                ["accounting"] = "finance analysis",
                ["auditing"] = "finance analysis",
                ["bookkeeping"] = "finance analysis",
                ["social media"] = "digital marketing",
                ["content strategy"] = "digital marketing",
                ["brand strategy"] = "digital marketing",
                ["clinical research"] = "medical research",
                ["patient care"] = "clinical practice",
                ["autocad"] = "cad design",
                ["revit"] = "cad design",
                ["video editing"] = "media production",
                ["storytelling"] = "media production",
            };

        public static readonly Dictionary<string, string> SkillFamilies =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["ui/ux design"] = "design",
                ["frontend engineering"] = "software",
                ["backend engineering"] = "software",
                [".net backend"] = "software",
                ["mobile development"] = "software",
                ["ml/ai"] = "software",
                ["data analysis"] = "analytics",
                ["finance analysis"] = "business",
                ["digital marketing"] = "business",
                ["medical research"] = "medicine",
                ["clinical practice"] = "medicine",
                ["cad design"] = "engineering",
                ["media production"] = "media",
            };

        public static readonly Dictionary<string, string[]> DisciplineKeywords =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["software"] = new[] { "software", "computer", "programming", "backend", "frontend", "mobile", "web", "ai", "data science" },
                ["engineering"] = new[] { "engineering", "civil", "mechanical", "electrical", "infrastructure", "cad", "revit", "autocad" },
                ["business"] = new[] { "business", "management", "marketing", "finance", "accounting", "operations", "strategy" },
                ["design"] = new[] { "design", "ui", "ux", "product design", "visual", "graphic", "prototyping" },
                ["media"] = new[] { "media", "content", "video", "journalism", "production", "communications" },
                ["medicine"] = new[] { "medicine", "clinical", "patient", "healthcare", "medical", "hospital", "pharmacy" },
                ["law"] = new[] { "law", "legal", "compliance", "regulatory", "contracts" },
                ["agriculture"] = new[] { "agriculture", "agronomy", "crop", "food systems", "irrigation" },
                ["education"] = new[] { "education", "teaching", "curriculum", "instructional", "learning" },
                ["architecture"] = new[] { "architecture", "urban", "building design", "space planning", "bim" },
            };
    }
}
