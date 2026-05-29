using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GraduationProject.API.DTOs;
using GraduationProject.API.Services;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IStudentRegisterService _studentService;
        private readonly ICompanyAnalysisService _companyAnalysisService;

        public AuthController(
            IAuthService authService,
            IStudentRegisterService studentService,
            ICompanyAnalysisService companyAnalysisService)
        {
            _authService = authService;
            _studentService = studentService;
            _companyAnalysisService = companyAnalysisService;
        }

        // =====================================================
        // POST /api/auth/register/student
        // =====================================================
        [HttpPost("register/student")]
        public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _studentService.RegisterAsync(dto);

            if (error != null)
                return error.Contains("already registered")
                    ? Conflict(new { message = error })
                    : BadRequest(new { message = error });

            return StatusCode(201, result);
        }

        // =====================================================
        // POST /api/auth/register/doctor
        // =====================================================
        [HttpPost("register/doctor")]
        public async Task<IActionResult> RegisterDoctor([FromBody] RegisterDoctorDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterDoctorAsync(dto);

            if (error != null)
                return Conflict(new { message = error });

            return StatusCode(201, result);
        }

        // =====================================================
        // POST /api/auth/company/analyze
        // =====================================================
        [HttpPost("company/analyze")]
        public async Task<IActionResult> AnalyzeCompany([FromBody] AnalyzeCompanyDto dto)
        {
            var (result, error) = await _companyAnalysisService.AnalyzeAsync(dto);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(result);
        }

        // =====================================================
        // POST /api/auth/register/company
        // =====================================================
        [HttpPost("register/company")]
        public async Task<IActionResult> RegisterCompany([FromBody] RegisterCompanyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterCompanyAsync(dto);

            if (error != null)
            {
                if (error.Contains("already registered") ||
                    error.Contains("already exists") ||
                    error.Contains("workspace"))
                    return Conflict(new { message = error });
                return BadRequest(new { message = error });
            }

            return StatusCode(201, result);
        }

        // =====================================================
        // POST /api/auth/register/association
        // =====================================================
        [HttpPost("register/association")]
        public async Task<IActionResult> RegisterStudentAssociation([FromBody] StudentAssociationRegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterStudentAssociationAsync(dto);

            if (error != null)
            {
                if (error.Contains("already registered") || error.Contains("already taken"))
                    return Conflict(new { message = error });
                return BadRequest(new { message = error });
            }

            return StatusCode(201, result);
        }

        // =====================================================
        // POST /api/auth/login
        // =====================================================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.LoginAsync(dto);

            if (error != null)
                return Unauthorized(new { message = error });

            return Ok(result);
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
                return Unauthorized(new { message = "Invalid session." });

            var (result, error) = await _authService.ChangePasswordAsync(userId, dto);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(result);
        }

        // =====================================================
        // POST /api/auth/google
        // يستقبل Google ID Token من الفرونت ويرجع JWT خاص بنا
        // =====================================================
        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.GoogleLoginAsync(dto);

            if (error != null)
                return Unauthorized(new { message = error });

            return Ok(result);
        }

        // =====================================================
        // POST /api/auth/forgot-password
        // =====================================================
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var message = await _authService.ForgotPasswordAsync(dto);
            return Ok(new MessageResponseDto { Message = message });
        }

        // =====================================================
        // POST /api/auth/reset-password
        // =====================================================
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, error) = await _authService.ResetPasswordAsync(dto);

            if (!success)
                return BadRequest(new { message = error });

            return Ok(new MessageResponseDto
            {
                Message = "Your password has been reset successfully. You can sign in with your new password."
            });
        }

    }
}
