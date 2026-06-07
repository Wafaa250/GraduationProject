using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace GraduationProject.API.Helpers
{
    public static class SectionStudentRosterParser
    {
        private static readonly Regex IdPattern = new(@"\b\d{4,20}\b", RegexOptions.Compiled);

        public static IReadOnlyList<string> ParseIds(byte[] content, string fileName)
        {
            if (content.Length == 0)
                return Array.Empty<string>();

            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            var text = ext switch
            {
                ".csv" or ".txt" => DecodeText(content),
                ".xlsx" or ".docx" => ExtractOfficeOpenXmlText(content),
                ".pdf" => ExtractPdfText(content),
                _ => DecodeText(content),
            };

            return ExtractIdsFromText(text);
        }

        private static string DecodeText(byte[] content)
        {
            try
            {
                return Encoding.UTF8.GetString(content);
            }
            catch
            {
                return Encoding.Latin1.GetString(content);
            }
        }

        private static List<string> ExtractIdsFromText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return new List<string>();

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var ids = new List<string>();

            foreach (Match match in IdPattern.Matches(text))
            {
                var id = match.Value.Trim();
                if (id.Length == 0 || !seen.Add(id))
                    continue;
                ids.Add(id);
            }

            return ids;
        }

        private static string ExtractOfficeOpenXmlText(byte[] content)
        {
            try
            {
                using var stream = new MemoryStream(content);
                using var archive = new ZipArchive(stream, ZipArchiveMode.Read);

                var parts = archive.Entries
                    .Where(e =>
                        e.FullName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase)
                        && (e.FullName.Contains("sharedStrings", StringComparison.OrdinalIgnoreCase)
                            || e.FullName.Contains("worksheets/", StringComparison.OrdinalIgnoreCase)
                            || e.FullName.Contains("document.xml", StringComparison.OrdinalIgnoreCase)))
                    .ToList();

                var builder = new StringBuilder();
                foreach (var part in parts)
                {
                    using var entry = part.Open();
                    using var reader = new StreamReader(entry, Encoding.UTF8);
                    var xml = reader.ReadToEnd();
                    try
                    {
                        var doc = XDocument.Parse(xml);
                        builder.Append(' ');
                        builder.Append(string.Join(' ', doc.Descendants().Select(n => n.Value)));
                    }
                    catch
                    {
                        builder.Append(' ');
                        builder.Append(StripXmlTags(xml));
                    }
                }

                return builder.ToString();
            }
            catch
            {
                return DecodeText(content);
            }
        }

        private static string ExtractPdfText(byte[] content)
        {
            var raw = DecodeText(content);
            var builder = new StringBuilder(raw);

            foreach (Match match in Regex.Matches(raw, @"\(([^\\)]+)\)", RegexOptions.Multiline))
            {
                builder.Append(' ');
                builder.Append(match.Groups[1].Value);
            }

            return builder.ToString();
        }

        private static string StripXmlTags(string xml)
        {
            return Regex.Replace(xml, "<[^>]+>", " ");
        }
    }
}
