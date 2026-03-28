// Services/LocalFileStorageService.cs
// ── Local disk implementation ─────────────────────────────────────────────────
// Files are saved to  wwwroot/uploads/{folder}/{uniqueName}
// Swap this entire class for CloudinaryFileStorageService (or S3, Azure Blob, etc.)
// without changing any controller or business logic.
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;

namespace GraduationProject.API.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _webRootPath;

        // Allowed extensions — extend as needed
        private static readonly HashSet<string> _allowed = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".zip",
            ".png", ".jpg", ".jpeg", ".gif", ".webp"
        };

        public LocalFileStorageService(IWebHostEnvironment env)
        {
            // Fallback to project root if wwwroot doesn't exist yet
            _webRootPath = string.IsNullOrEmpty(env.WebRootPath)
                ? Path.Combine(env.ContentRootPath, "wwwroot")
                : env.WebRootPath;
        }

        // ── SaveAsync ─────────────────────────────────────────────────────────
        public async Task<string> SaveAsync(string base64Content, string fileName, string folder = "uploads")
        {
            // 1. Validate extension
            var ext = Path.GetExtension(fileName);
            if (!_allowed.Contains(ext))
                throw new InvalidOperationException($"File type '{ext}' is not allowed.");

            // 2. Build unique name to avoid collisions
            var uniqueName = $"{Guid.NewGuid():N}{ext}";
            var relativePath = Path.Combine(folder, uniqueName).Replace("\\", "/");
            var fullPath = Path.Combine(_webRootPath, folder, uniqueName);

            // 3. Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            // 4. Decode base64 and write to disk
            var bytes = Convert.FromBase64String(base64Content);
            await File.WriteAllBytesAsync(fullPath, bytes);

            // Return relative path — controller stores this in DB
            return relativePath;
        }

        // ── DeleteAsync ───────────────────────────────────────────────────────
        public Task DeleteAsync(string filePath)
        {
            var fullPath = Path.Combine(_webRootPath, filePath.TrimStart('/'));
            if (File.Exists(fullPath))
                File.Delete(fullPath);
            return Task.CompletedTask;
        }

        // ── GetUrl ────────────────────────────────────────────────────────────
        // Returns a relative URL served by ASP.NET Core static files middleware.
        // Example: /uploads/projects/abc123.pdf
        public string GetUrl(string filePath) => "/" + filePath.Replace("\\", "/").TrimStart('/');
    }
}
