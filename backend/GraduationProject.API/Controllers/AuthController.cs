/*using GraduationProject.API.Data;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] User user)
        {
            user.CreatedAt = DateTime.UtcNow;

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(user);
        }
    }
}*/


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

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // ===========================
        // POST /api/auth/register/student
        // ===========================
        [HttpPost("register/student")]
        public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterStudentAsync(dto);

            if (error != null)
                return Conflict(new { message = error });

            return CreatedAtAction(nameof(RegisterStudent), result);
        }

        // ===========================
        // POST /api/auth/register/doctor
        // ===========================
        [HttpPost("register/doctor")]
        public async Task<IActionResult> RegisterDoctor([FromBody] RegisterDoctorDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterDoctorAsync(dto);

            if (error != null)
                return Conflict(new { message = error });

            return CreatedAtAction(nameof(RegisterDoctor), result);
        }

        // ===========================
        // POST /api/auth/register/company
        // ===========================
        [HttpPost("register/company")]
        public async Task<IActionResult> RegisterCompany([FromBody] RegisterCompanyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterCompanyAsync(dto);

            if (error != null)
                return Conflict(new { message = error });

            return CreatedAtAction(nameof(RegisterCompany), result);
        }

        // ===========================
        // POST /api/auth/register/association
        // ===========================
        [HttpPost("register/association")]
        public async Task<IActionResult> RegisterAssociation([FromBody] RegisterAssociationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (result, error) = await _authService.RegisterAssociationAsync(dto);

            if (error != null)
                return Conflict(new { message = error });

            return CreatedAtAction(nameof(RegisterAssociation), result);
        }

        // ===========================
        // POST /api/auth/login
        // (same endpoint for ALL roles)
        // ===========================
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
