using System.Collections.Generic;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using Microsoft.AspNetCore.Http;

namespace GraduationProject.API.Services
{
    public enum DoctorPostAccessResult
    {
        Success,
        NotFound,
        Forbidden,
    }

    public class DoctorPostMutationResult
    {
        public DoctorPostAccessResult Status { get; init; }
        public DoctorPostDto? Post { get; init; }

        public static DoctorPostMutationResult Ok(DoctorPostDto post) =>
            new() { Status = DoctorPostAccessResult.Success, Post = post };

        public static DoctorPostMutationResult NotFound() =>
            new() { Status = DoctorPostAccessResult.NotFound };

        public static DoctorPostMutationResult Forbidden() =>
            new() { Status = DoctorPostAccessResult.Forbidden };
    }

    public interface IDoctorPostService
    {
        Task<DoctorPostDto> CreateAsync(int userId, string content, IFormFile? file);
        Task<List<DoctorPostDto>> GetFeedAsync(int take = 80);
        Task<DoctorPostMutationResult> UpdateAsync(
            int userId,
            int postId,
            string content,
            IFormFile? file,
            bool removeAttachment);
        Task<DoctorPostAccessResult> DeleteAsync(int userId, int postId);
    }
}
