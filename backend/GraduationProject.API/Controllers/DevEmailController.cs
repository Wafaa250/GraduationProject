using System.Threading.Tasks;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Development-only helper to verify SMTP without creating a workspace member.
    /// </summary>
    [ApiController]
    [Route("api/dev/email")]
    public class DevEmailController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _environment;

        public DevEmailController(
            IEmailService emailService,
            IConfiguration config,
            IWebHostEnvironment environment)
        {
            _emailService = emailService;
            _config = config;
            _environment = environment;
        }

        [HttpPost("welcome-test")]
        public async Task<IActionResult> SendWelcomeTest([FromBody] DevWelcomeEmailTestDto dto)
        {
            if (!_environment.IsDevelopment())
                return NotFound();

            if (string.IsNullOrWhiteSpace(dto.ToEmail))
                return BadRequest(new { message = "toEmail is required." });

            var loginUrl = (_config["App:FrontendLoginUrl"] ?? "http://localhost:5173/login").Trim();
            var tempPassword = dto.TemporaryPassword?.Trim();
            if (string.IsNullOrWhiteSpace(tempPassword))
                tempPassword = "Test-Temp-Password-12!";

            try
            {
                await _emailService.SendCompanyMemberWelcomeEmailAsync(
                    dto.ToEmail.Trim(),
                    string.IsNullOrWhiteSpace(dto.FullName) ? "Test Member" : dto.FullName.Trim(),
                    string.IsNullOrWhiteSpace(dto.CompanyName) ? "SkillSwap Demo Company" : dto.CompanyName.Trim(),
                    dto.ToEmail.Trim(),
                    tempPassword,
                    loginUrl);

                return Ok(new
                {
                    message = "Welcome email sent.",
                    to = dto.ToEmail.Trim(),
                    note = "Check inbox and spam. This endpoint is only available in Development.",
                });
            }
            catch (EmailSendException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class DevWelcomeEmailTestDto
    {
        public string ToEmail { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? CompanyName { get; set; }
        public string? TemporaryPassword { get; set; }
    }
}
