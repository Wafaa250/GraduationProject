using System.Threading.Tasks;
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

        public AuthController(IAuthService authService, IStudentRegisterService studentService)
        {
            _authService = authService;
            _studentService = studentService;
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
        // POST /api/auth/register/company
        // =====================================================
        [HttpPost("register/company")]
        public async Task<IActionResult> RegisterCompany([FromBody] RegisterCompanyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterCompanyAsync(dto);

            if (error != null)
                return Conflict(new { message = error });

            return StatusCode(201, result);
        }

        // =====================================================
        // POST /api/auth/register/association
        // =====================================================
        [HttpPost("register/association")]
        public async Task<IActionResult> RegisterAssociation([FromBody] RegisterAssociationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterAssociationAsync(dto);

            if (error != null)
                return Conflict(new { message = error });

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
    }
}
