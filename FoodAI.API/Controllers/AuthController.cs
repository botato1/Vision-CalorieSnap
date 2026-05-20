
using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;
using FoodAI.API.Infrastructure;
using FoodAI.API.Services;
using FoodAI.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;


namespace FoodAI.API.Controllers
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

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserRequest request)
        {
            var result = await _authService.LoginAsync(request);

            if (result is null)
                return Unauthorized(new { message = "ID 또는 비밀번호가 틀렸습니다." });

            return Ok(new 
            {
                message = "로그인 성공",
                profileId = result.ProfileID,
                name = result.Name
            });
        }
        // POST /api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserProfileRequest request)
        {
            if (await _authService.ExistsAsync(request.ProfileID))
                return Conflict(new { message = "이미 사용 중인 ID입니다." });

            var model = UserService.ToModel(request);
            var createdId = await _authService.CreateAsync(model);

            return StatusCode(201, new
            {
                message = "회원가입 성공",
                profileId = createdId,
                name = request.Name
            });
        }

   




    }

    // 로그인 요청 데이터
    
}
