using System.Text;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using UglyToad.PdfPig;

namespace GraduationProject.API.Services
{
    public class RosterStudentIdExtractor : IRosterStudentIdExtractor
    {
        private static readonly string[] IdHeaderTokens =
        {
            "studentid", "student id", "student_id", "student number", "student no", "student #",
            "universityid", "university id", "university_id", "university number",
            "id", "id number", "id #", "roll", "roll no", "roll number",
            "registration", "reg no", "reg number", "matric", "matriculation",
        };

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".csv", ".xlsx", ".docx", ".pdf",
        };

        public Task<RosterExtractResult> ExtractAsync(
            Stream stream,
            string fileName,
            CancellationToken cancellationToken = default)
        {
            var extension = Path.GetExtension(fileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            {
                throw new InvalidOperationException(
                    "Unsupported file type. Upload CSV, Excel (.xlsx), Word (.docx), or PDF.");
            }

            return Task.Run(() =>
            {
                cancellationToken.ThrowIfCancellationRequested();
                var collector = new IdCollector();

                switch (extension.ToLowerInvariant())
                {
                    case ".csv":
                        ExtractFromCsv(stream, collector, cancellationToken);
                        break;
                    case ".xlsx":
                        ExtractFromExcel(stream, collector, cancellationToken);
                        break;
                    case ".docx":
                        ExtractFromWord(stream, collector, cancellationToken);
                        break;
                    case ".pdf":
                        ExtractFromPdf(stream, collector, cancellationToken);
                        break;
                    default:
                        throw new InvalidOperationException("Unsupported file type.");
                }

                return new RosterExtractResult
                {
                    StudentIds = collector.GetDistinctIds(),
                    CandidateCount = collector.CandidateCount,
                };
            }, cancellationToken);
        }

        private static void ExtractFromCsv(Stream stream, IdCollector collector, CancellationToken ct)
        {
            using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
            var rows = new List<string[]>();
            string? line;
            while ((line = reader.ReadLine()) != null)
            {
                ct.ThrowIfCancellationRequested();
                if (string.IsNullOrWhiteSpace(line)) continue;
                rows.Add(ParseCsvLine(line));
            }

            if (rows.Count == 0) return;

            var idColumnIndexes = DetectIdColumns(rows[0]);
            if (idColumnIndexes.Count > 0)
            {
                for (var r = 1; r < rows.Count; r++)
                {
                    foreach (var col in idColumnIndexes)
                    {
                        if (col < rows[r].Length)
                            collector.AddCell(rows[r][col]);
                    }
                }
            }
            else
            {
                foreach (var row in rows)
                {
                    foreach (var cell in row)
                        collector.AddCell(cell);
                }
            }
        }

        private static void ExtractFromExcel(Stream stream, IdCollector collector, CancellationToken ct)
        {
            using var workbook = new XLWorkbook(stream);
            foreach (var worksheet in workbook.Worksheets)
            {
                ct.ThrowIfCancellationRequested();
                var range = worksheet.RangeUsed();
                if (range == null) continue;

                var firstRow = range.FirstRow().RowNumber();
                var lastRow = range.LastRow().RowNumber();
                var firstCol = range.FirstColumn().ColumnNumber();
                var lastCol = range.LastColumn().ColumnNumber();

                var headerCells = new List<string>();
                for (var c = firstCol; c <= lastCol; c++)
                    headerCells.Add(range.Cell(firstRow, c).GetFormattedString());

                var idColumns = DetectIdColumns(headerCells.ToArray());
                if (idColumns.Count > 0)
                {
                    for (var r = firstRow + 1; r <= lastRow; r++)
                    {
                        foreach (var colOffset in idColumns)
                        {
                            var col = firstCol + colOffset;
                            if (col <= lastCol)
                                collector.AddCell(range.Cell(r, col).GetFormattedString());
                        }
                    }
                }
                else
                {
                    for (var r = firstRow; r <= lastRow; r++)
                    {
                        for (var c = firstCol; c <= lastCol; c++)
                            collector.AddCell(range.Cell(r, c).GetFormattedString());
                    }
                }
            }
        }

        private static void ExtractFromWord(Stream stream, IdCollector collector, CancellationToken ct)
        {
            using var document = WordprocessingDocument.Open(stream, false);
            var body = document.MainDocumentPart?.Document?.Body;
            if (body == null) return;

            foreach (var paragraph in body.Elements<Paragraph>())
            {
                ct.ThrowIfCancellationRequested();
                var text = string.Concat(paragraph.Descendants<Text>().Select(t => t.Text));
                collector.AddPlainText(text);
            }

            foreach (var table in body.Elements<Table>())
            {
                ct.ThrowIfCancellationRequested();
                var tableRows = table.Elements<TableRow>().ToList();
                if (tableRows.Count == 0) continue;

                var headerCells = tableRows[0].Elements<TableCell>()
                    .Select(c => string.Concat(c.Descendants<Text>().Select(t => t.Text)))
                    .ToArray();
                var idColumns = DetectIdColumns(headerCells);

                if (idColumns.Count > 0)
                {
                    for (var r = 1; r < tableRows.Count; r++)
                    {
                        var cells = tableRows[r].Elements<TableCell>().ToList();
                        foreach (var col in idColumns)
                        {
                            if (col < cells.Count)
                            {
                                var cellText = string.Concat(cells[col].Descendants<Text>().Select(t => t.Text));
                                collector.AddCell(cellText);
                            }
                        }
                    }
                }
                else
                {
                    foreach (var row in tableRows)
                    {
                        foreach (var cell in row.Elements<TableCell>())
                        {
                            var cellText = string.Concat(cell.Descendants<Text>().Select(t => t.Text));
                            collector.AddCell(cellText);
                        }
                    }
                }
            }
        }

        private static void ExtractFromPdf(Stream stream, IdCollector collector, CancellationToken ct)
        {
            using var document = PdfDocument.Open(stream);
            foreach (var page in document.GetPages())
            {
                ct.ThrowIfCancellationRequested();
                collector.AddPlainText(page.Text);
            }
        }

        private static List<int> DetectIdColumns(string[] headers)
        {
            var indexes = new List<int>();
            for (var i = 0; i < headers.Length; i++)
            {
                var normalized = NormalizeHeader(headers[i]);
                if (IdHeaderTokens.Any(t => normalized == t || normalized.Contains(t, StringComparison.Ordinal)))
                    indexes.Add(i);
            }

            if (indexes.Count == 0)
            {
                for (var i = 0; i < headers.Length; i++)
                {
                    if (NormalizeHeader(headers[i]) is "id" or "#")
                        indexes.Add(i);
                }
            }

            return indexes;
        }

        private static string NormalizeHeader(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            return Regex.Replace(value.Trim().ToLowerInvariant(), @"\s+", " ");
        }

        private static string[] ParseCsvLine(string line)
        {
            var cells = new List<string>();
            var current = new StringBuilder();
            var inQuotes = false;

            for (var i = 0; i < line.Length; i++)
            {
                var ch = line[i];
                if (ch == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }
                    continue;
                }

                if (!inQuotes && (ch == ',' || ch == ';' || ch == '\t'))
                {
                    cells.Add(current.ToString().Trim());
                    current.Clear();
                    continue;
                }

                current.Append(ch);
            }

            cells.Add(current.ToString().Trim());
            return cells.ToArray();
        }

        private sealed class IdCollector
        {
            private readonly List<string> _ordered = new();
            private readonly HashSet<string> _seen = new(StringComparer.OrdinalIgnoreCase);

            public int CandidateCount { get; private set; }

            public void AddCell(string? value)
            {
                if (string.IsNullOrWhiteSpace(value)) return;
                var trimmed = value.Trim();
                if (LooksLikeStudentId(trimmed))
                    TryAdd(trimmed);
                else
                    AddPlainText(trimmed);
            }

            public void AddPlainText(string? text)
            {
                if (string.IsNullOrWhiteSpace(text)) return;
                foreach (var token in Regex.Split(text, @"[\s,;|\t\r\n]+"))
                {
                    var t = token.Trim().Trim('"', '\'');
                    if (LooksLikeStudentId(t))
                        TryAdd(t);
                }
            }

            private void TryAdd(string id)
            {
                CandidateCount++;
                var normalized = id.Trim();
                if (_seen.Add(normalized))
                    _ordered.Add(normalized);
            }

            public List<string> GetDistinctIds() => _ordered;
        }

        internal static bool LooksLikeStudentId(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return false;
            var t = value.Trim();
            if (t.Length < 4 || t.Length > 20) return false;
            if (!t.Any(char.IsDigit)) return false;
            return t.All(c => char.IsLetterOrDigit(c) || c is '-' or '_');
        }
    }
}
