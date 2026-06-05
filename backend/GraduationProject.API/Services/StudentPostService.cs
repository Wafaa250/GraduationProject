using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public class StudentPostService : IStudentPostService
    {
        private const int MaxContentLength = 4000;
        private const long MaxAttachmentBytes = 8 * 1024 * 1024;
        private const string AttachmentFolder = "student-posts";

        private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private static readonly string[] FileExtensions = { ".pdf", ".docx" };
        private readonly ApplicationDbContext _db;
        private readonly IFileStorageService _files;

        public StudentPostService(ApplicationDbContext db, IFileStorageService files)
        {
            _db = db;
            _files = files;
        }

        public async Task<StudentPostDto> CreateAsync(int userId, string content, IFormFile? file)
        {
            var trimmed = (content ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                throw new InvalidOperationException("Post content is required.");

            if (trimmed.Length > MaxContentLength)
                throw new InvalidOperationException($"Post content cannot exceed {MaxContentLength} characters.");

            string? attachmentUrl = null;
            string? attachmentType = null;

            if (file != null && file.Length > 0)
            {
                var saved = await SaveAttachmentAsync(file);
                attachmentUrl = saved.Url;
                attachmentType = saved.Type;
            }

            var now = DateTime.UtcNow;
            var post = new StudentPost
            {
                UserId = userId,
                Content = trimmed,
                AttachmentUrl = attachmentUrl,
                AttachmentType = attachmentType,
                CreatedAt = now,
                UpdatedAt = now,
            };

            _db.StudentPosts.Add(post);
            await _db.SaveChangesAsync();

            var loaded = await LoadByIdAsync(post.Id);
            return loaded ?? MapRow(post, null, null);
        }

        public async Task<List<StudentPostDto>> GetFeedAsync(int take = 80)
        {
            var limit = Math.Clamp(take, 1, 200);
            var rows = await _db.StudentPosts
                .AsNoTracking()
                .Include(p => p.User)
                    .ThenInclude(u => u.StudentProfile)
                .OrderByDescending(p => p.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return rows.Select(p => MapRow(
                p,
                p.User?.Name,
                p.User?.StudentProfile)).ToList();
        }

        public async Task<StudentPostMutationResult> UpdateAsync(
            int userId,
            int postId,
            string content,
            IFormFile? file,
            bool removeAttachment)
        {
            var post = await _db.StudentPosts.FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null) return StudentPostMutationResult.NotFound();
            if (post.UserId != userId) return StudentPostMutationResult.Forbidden();

            var trimmed = (content ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                throw new InvalidOperationException("Post content is required.");

            if (trimmed.Length > MaxContentLength)
                throw new InvalidOperationException($"Post content cannot exceed {MaxContentLength} characters.");

            if (file != null && file.Length > 0)
            {
                await DeleteAttachmentIfPresentAsync(post.AttachmentUrl);
                var (url, type) = await SaveAttachmentAsync(file);
                post.AttachmentUrl = url;
                post.AttachmentType = type;
            }
            else if (removeAttachment)
            {
                await DeleteAttachmentIfPresentAsync(post.AttachmentUrl);
                post.AttachmentUrl = null;
                post.AttachmentType = null;
            }

            post.Content = trimmed;
            post.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var loaded = await LoadByIdAsync(post.Id);
            return loaded == null
                ? StudentPostMutationResult.NotFound()
                : StudentPostMutationResult.Ok(loaded);
        }

        public async Task<StudentPostAccessResult> DeleteAsync(int userId, int postId)
        {
            var post = await _db.StudentPosts.FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null) return StudentPostAccessResult.NotFound;
            if (post.UserId != userId) return StudentPostAccessResult.Forbidden;

            await DeleteAttachmentIfPresentAsync(post.AttachmentUrl);

            _db.StudentPosts.Remove(post);
            await _db.SaveChangesAsync();
            return StudentPostAccessResult.Success;
        }

        private async Task<(string Url, string Type)> SaveAttachmentAsync(IFormFile file)
        {
            if (file.Length > MaxAttachmentBytes)
                throw new InvalidOperationException("Attachment must be 8 MB or smaller.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            string attachmentType;
            if (ImageExtensions.Contains(ext))
            {
                attachmentType = StudentPostAttachmentType.Image;
            }
            else if (FileExtensions.Contains(ext))
            {
                attachmentType = StudentPostAttachmentType.File;
            }
            else
            {
                throw new InvalidOperationException(
                    "Allowed attachments: JPG, JPEG, PNG, WEBP, PDF, and DOCX.");
            }

            var allowed = attachmentType == StudentPostAttachmentType.Image
                ? ImageExtensions
                : FileExtensions;

            var storedPath = await _files.SaveFormFileAsync(
                file,
                AttachmentFolder,
                allowed,
                MaxAttachmentBytes);

            return (_files.GetUrl(storedPath), attachmentType);
        }

        private async Task DeleteAttachmentIfPresentAsync(string? attachmentUrl)
        {
            if (string.IsNullOrWhiteSpace(attachmentUrl)) return;
            try
            {
                await _files.DeleteAsync(attachmentUrl);
            }
            catch
            {
                // Best-effort file cleanup.
            }
        }

        private async Task<StudentPostDto?> LoadByIdAsync(int id)
        {
            var row = await _db.StudentPosts
                .AsNoTracking()
                .Include(p => p.User)
                    .ThenInclude(u => u.StudentProfile)
                .FirstOrDefaultAsync(p => p.Id == id);

            return row == null ? null : MapRow(row, row.User?.Name, row.User?.StudentProfile);
        }

        private static StudentPostDto MapRow(
            StudentPost post,
            string? authorName,
            StudentProfile? student)
        {
            return new StudentPostDto
            {
                Id = post.Id,
                UserId = post.UserId,
                AuthorName = authorName ?? "Student",
                AuthorAvatarBase64 = student?.ProfilePictureBase64,
                AuthorSubtitle = student?.Major,
                Content = post.Content,
                AttachmentUrl = post.AttachmentUrl,
                AttachmentType = post.AttachmentType,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
            };
        }
    }
}
