using System;
using System.Threading.Tasks;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/doctor-posts")]
    [Authorize]
    public class DoctorPostsController : ControllerBase
    {
        private const long MaxAttachmentBytes = 8 * 1024 * 1024;
        private readonly IDoctorPostService _posts;

        public DoctorPostsController(IDoctorPostService posts)
        {
            _posts = posts;
        }

        /// <summary>POST /api/doctor-posts — doctors only. Multipart: content + optional file.</summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MaxAttachmentBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxAttachmentBytes)]
        public async Task<IActionResult> Create([FromForm] string content, [FromForm] IFormFile? file)
        {
            if (!IsDoctor())
                return StatusCode(403, new { message = "Only doctors can create posts." });

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
                return Unauthorized();

            try
            {
                var created = await _posts.CreateAsync(userId, content, file);
                return Ok(created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>PUT /api/doctor-posts/{id} — owner only. Multipart: content, optional file, removeAttachment.</summary>
        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MaxAttachmentBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxAttachmentBytes)]
        public async Task<IActionResult> Update(
            int id,
            [FromForm] string content,
            [FromForm] IFormFile? file,
            [FromForm] bool removeAttachment = false)
        {
            if (!IsDoctor())
                return StatusCode(403, new { message = "Only doctors can edit their posts." });

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
                return Unauthorized();

            try
            {
                var result = await _posts.UpdateAsync(userId, id, content, file, removeAttachment);
                return result.Status switch
                {
                    DoctorPostAccessResult.Success => Ok(result.Post),
                    DoctorPostAccessResult.NotFound => NotFound(new { message = "Post not found." }),
                    DoctorPostAccessResult.Forbidden => StatusCode(403, new { message = "You can only edit your own posts." }),
                    _ => BadRequest(new { message = "Could not update post." }),
                };
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>GET /api/doctor-posts/feed — recent doctor social posts (all authenticated users).</summary>
        [HttpGet("feed")]
        public async Task<IActionResult> GetFeed([FromQuery] int take = 80)
        {
            var items = await _posts.GetFeedAsync(take);
            return Ok(new DoctorPostFeedDto { Items = items });
        }

        /// <summary>DELETE /api/doctor-posts/{id} — owner only.</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsDoctor())
                return StatusCode(403, new { message = "Only doctors can delete their posts." });

            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
                return Unauthorized();

            var result = await _posts.DeleteAsync(userId, id);
            return result switch
            {
                DoctorPostAccessResult.Success => NoContent(),
                DoctorPostAccessResult.NotFound => NotFound(new { message = "Post not found." }),
                DoctorPostAccessResult.Forbidden => StatusCode(403, new { message = "You can only delete your own posts." }),
                _ => BadRequest(new { message = "Could not delete post." }),
            };
        }

        private bool IsDoctor() =>
            string.Equals(AuthorizationHelper.GetRole(User), "doctor", StringComparison.OrdinalIgnoreCase);
    }
}
