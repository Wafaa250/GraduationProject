using System.Collections.Generic;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using Microsoft.AspNetCore.Http;

namespace GraduationProject.API.Services
{
    public enum StudentPostAccessResult
    {
        Success,
        NotFound,
        Forbidden,
    }

    public class StudentPostMutationResult
    {
        public StudentPostAccessResult Status { get; init; }
        public StudentPostDto? Post { get; init; }

        public static StudentPostMutationResult Ok(StudentPostDto post) =>
            new() { Status = StudentPostAccessResult.Success, Post = post };

        public static StudentPostMutationResult NotFound() =>
            new() { Status = StudentPostAccessResult.NotFound };

        public static StudentPostMutationResult Forbidden() =>
            new() { Status = StudentPostAccessResult.Forbidden };
    }

    public interface IStudentPostService
    {
        Task<StudentPostDto> CreateAsync(int userId, string content, IFormFile? file);
        Task<List<StudentPostDto>> GetFeedAsync(int take = 80);
        Task<StudentPostMutationResult> UpdateAsync(
            int userId,
            int postId,
            string content,
            IFormFile? file,
            bool removeAttachment);
        Task<StudentPostAccessResult> DeleteAsync(int userId, int postId);
    }
}
