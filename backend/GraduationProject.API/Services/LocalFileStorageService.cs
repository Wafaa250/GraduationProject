// Services/LocalFileStorageService.cs
// ── Local disk implementation ─────────────────────────────────────────────────
// Files are saved to  wwwroot/uploads/{folder}/{uniqueName}
// Swap this entire class for CloudinaryFileStorageService (or S3, Azure Blob, etc.)
// without changing any controller or business logic.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

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

        // ── SaveFormFileAsync ─────────────────────────────────────────────────
        public async Task<string> SaveFormFileAsync(
            IFormFile file,
            string folder,
            IReadOnlyCollection<string> allowedExtensions,
            long maxBytes)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("No file was uploaded.");

            if (file.Length > maxBytes)
                throw new InvalidOperationException($"File exceeds the maximum size of {maxBytes / (1024 * 1024)}MB.");

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !allowedExtensions.Contains(ext, StringComparer.OrdinalIgnoreCase))
                throw new InvalidOperationException("File type is not allowed.");

            var uniqueName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
            var relativePath = Path.Combine(folder, uniqueName).Replace("\\", "/");
            var fullPath = Path.Combine(_webRootPath, folder, uniqueName);

            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            await using var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            await file.CopyToAsync(stream);

            return relativePath;
        }
    }
}
